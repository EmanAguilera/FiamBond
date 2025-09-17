<?php

namespace App\Http\Controllers;

use App\Models\Family;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Carbon;

class FamilyController extends Controller
{

    // --- ADD A CONSTANT FOR THE LIMIT ---
    // Defining it here makes it easy to find and change later.
    const MAX_MEMBERS_PER_FAMILY = 10;

    /**
     * Display a listing of the resource.
     * --- THE FIX ---
     * We'll use the paginate() method here to automatically handle
     * the pagination logic on the backend.
     */
    public function index(Request $request)
    {
        // Change `get()` to `paginate()` to return a paginated response.
        // Let's display 5 families per page as an example.
        return $request->user()->families()->with('owner')->paginate(5);
    }

    public function store(Request $request)
    {
        $fields = $request->validate([
            'first_name' => 'required|string|max:255'
        ]);

        $family = Family::create([
            'first_name' => $fields['first_name'],
            'owner_id' => $request->user()->id,
        ]);

        $family->members()->attach($request->user()->id);

        return response($family, 201);
    }

    public function show(Family $family)
    {
        return $family->load('members');
    }

    public function addMember(Request $request, Family $family)
    {

         // --- START OF THE FIX: ENFORCE THE LIMIT ---
        // First, count the current number of members.
        if ($family->members()->count() >= self::MAX_MEMBERS_PER_FAMILY) {
            // If the family is full, return a 'Forbidden' error.
            return response(['message' => 'This family has reached the maximum member limit of ' . self::MAX_MEMBERS_PER_FAMILY . '.'], 403);
        }
        // --- END OF THE FIX ---
        
        if ($request->user()->id !== $family->owner_id) {
            return response(['message' => 'Only the family owner can add members.'], 403);
        }

        $fields = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', Rule::exists('users', 'email')],
        ]);

        $user = User::where('email', $fields['email'])->first();

        if ($family->members()->where('user_id', $user->id)->exists()) {
            return response(['message' => 'This user is already a member of the family.'], 422);
        }

        $family->members()->attach($user->id);
        return $family->load('members');
    }
    // --- END of unchanged methods ---


    /**
     * Generate a financial report for a specific family.
     */
    public function monthlyReport(Request $request, Family $family)
    {
        // Authorization check remains the same
        if (!$family->members()->where('user_id', $request->user()->id)->exists()) {
            return response(['message' => 'Unauthorized'], 403);
        }
        
        // Date range logic remains the same
        $period = $request->query('period', 'monthly');
        if (!in_array($period, ['weekly', 'monthly', 'yearly'])) {
            $period = 'monthly';
        }

        $now = Carbon::now();
        if ($period === 'weekly') {
            $startDate = $now->copy()->startOfWeek();
            $endDate = $now->copy()->endOfWeek();
            $title = 'This Week (' . $startDate->format('M d') . ' - ' . $endDate->format('M d') . ')';
        } elseif ($period === 'yearly') {
            $startDate = $now->copy()->startOfYear();
            $endDate = $now->copy()->endOfYear();
            $title = 'This Year (' . $now->format('Y') . ')';
        } else { // 'monthly' is the default
            $startDate = $now->copy()->startOfMonth();
            $endDate = $now->copy()->endOfMonth();
            $title = $now->format('F Y');
        }

        // --- START OF PAGINATION FIX ---
        // We fetch ALL transactions for the period to calculate totals accurately.
        $allTransactionsForPeriod = $family->transactions()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();
        
        // We create a SEPARATE paginated query for the list view.
        // Let's show 10 transactions per page.
        $paginatedTransactions = $family->transactions()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest() // Order by most recents
            ->paginate(10);

        // Calculations for totals should use the complete, unpaginated list.
        $inflow = $allTransactionsForPeriod->where('type', 'income')->sum('amount');
        $outflow = $allTransactionsForPeriod->where('type', 'expense')->sum('amount');

        // The chart should also be prepared with all data for the period.
        $chartData = $this->prepareChartData($allTransactionsForPeriod, $period, $startDate);

        return response([
            'reportTitle' => $title,
            'familyName' => $family->first_name,
            'totalInflow' => $inflow,
            'totalOutflow' => $outflow,
            'netPosition' => $inflow - $outflow,
            'transactionCount' => $allTransactionsForPeriod->count(),
            'chartData' => $chartData,
            // The 'transactions' key now holds the full pagination object.
            'transactions' => $paginatedTransactions, 
        ]);
        // --- END OF PAGINATION FIX ---
    }


    /**
     * Helper function to format transaction data for chart.js.
     * This is the same helper from ReportController.
     */
    private function prepareChartData($transactions, $period, Carbon $startDate)
    {
        $labels = [];
        $inflowData = [];
        $outflowData = [];

        if ($period === 'weekly') {
            $labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            $inflowData = array_fill(0, 7, 0);
            $outflowData = array_fill(0, 7, 0);
            
            foreach ($transactions as $transaction) {
                $dayIndex = Carbon::parse($transaction->created_at)->dayOfWeek;
                if ($transaction->type === 'income') {
                    $inflowData[$dayIndex] += $transaction->amount;
                } else {
                    $outflowData[$dayIndex] += $transaction->amount;
                }
            }
        } else {
            $daysInMonth = $startDate->daysInMonth;
            $groupFormat = ($period === 'yearly') ? 'n' : 'j';

            if ($period === 'yearly') {
                $labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                $labelCount = 12;
            } else {
                $labels = range(1, $daysInMonth);
                $labelCount = $daysInMonth;
            }

            $inflowByGroup = $transactions->where('type', 'income')->groupBy(function($date) use ($groupFormat) {
                return Carbon::parse($date->created_at)->format($groupFormat);
            })->map->sum('amount');

            $outflowByGroup = $transactions->where('type', 'expense')->groupBy(function($date) use ($groupFormat) {
                return Carbon::parse($date->created_at)->format($groupFormat);
            })->map->sum('amount');

            $inflowData = array_fill(0, $labelCount, 0);
            $outflowData = array_fill(0, $labelCount, 0);

            for ($i = 0; $i < $labelCount; $i++) {
                $groupKey = (string)($i + 1);
                if (isset($inflowByGroup[$groupKey])) {
                    $inflowData[$i] = $inflowByGroup[$groupKey];
                }
                if (isset($outflowByGroup[$groupKey])) {
                    $outflowData[$i] = $outflowByGroup[$groupKey];
                }
            }
        }

        return [
            'labels' => $labels,
            'datasets' => [
                ['label' => 'Inflow', 'data' => $inflowData, 'backgroundColor' => 'rgba(75, 192, 192, 0.6)'],
                ['label' => 'Outflow', 'data' => $outflowData, 'backgroundColor' => 'rgba(255, 99, 132, 0.6)']
            ]
        ];
    }

    public function summaries(Request $request)
    {
        $user = $request->user();
        $families = $user->families()->with('owner')->paginate(2);

        $families->getCollection()->transform(function ($family){
            $inflow = $family->transactions()->where('type', 'income')->sum('amount');
            $outflow = $family->transactions()->where('type', 'expense')->sum('amount');

            return [
                'id' => $family->id,
                'first_name' => $family->first_name,
                'owner_name' => $family->owner->full_name,
                'totalInflow' => $inflow,
                'totalOutflow' => $outflow,
                'netPosition' => $inflow - $outflow,
            ];
        });

        return response($families);
    }
}
