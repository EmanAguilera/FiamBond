<?php

namespace App\Http\Controllers;

use App\Models\Family;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class FamilyController extends Controller
{
    const MAX_MEMBERS_PER_FAMILY = 10;

    public function index(Request $request)
    {
        return $request->user()->families()->with('owner')->withCount('members')->paginate(5);
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
        if ($family->members()->count() >= self::MAX_MEMBERS_PER_FAMILY) {
            return response(['message' => 'This family has reached the maximum member limit of ' . self::MAX_MEMBERS_PER_FAMILY . '.'], 403);
        }
        
        // --- THE FIX ---
        // Replace the Gate with a direct authorization check.
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

    public function update(Request $request, Family $family)
    {
        // --- THE FIX ---
        // Replace the Gate with a direct authorization check.
        if ($request->user()->id !== $family->owner_id) {
            return response(['message' => 'Only the family owner can perform this action.'], 403);
        }

        $fields = $request->validate([
            'first_name' => 'required|string|max:255'
        ]);

        $family->update($fields);

        // --- THE FIX ---
        // After updating, we reload the `owner` relationship and the `members` count
        // to ensure the API response has the same data structure as the initial page load.
        // This prevents the frontend from crashing.
        return response($family->load('owner')->loadCount('members'));
    }

    public function destroy(Request $request, Family $family)
    {
         // --- THE FIX: Add logging to debug the authorization check ---
        
        // Log the ID of the user attempting the action.
        Log::info('Delete attempt by User ID: ' . $request->user()->id);

        // Log the details of the family being deleted, including its owner's ID.
        Log::info('Attempting to delete Family ID: ' . $family->id . ' with Owner ID: ' . $family->owner_id);

        // This is the authorization check.
        if ($request->user()->id !== $family->owner_id) {
            // Log that the authorization failed before sending the response.
            Log::warning('Authorization FAILED for family deletion.');
            return response(['message' => 'Only the family owner can perform this action.'], 403);
        }

        // If the check passes, log the success.
        Log::info('Authorization PASSED. Deleting family.');
        
        $family->delete();

        return response(['message' => 'Family has been deleted successfully.']);
    }

    public function monthlyReport(Request $request, Family $family)
    {
        if (!$family->members()->where('user_id', $request->user()->id)->exists()) {
            return response(['message' => 'Unauthorized'], 403);
        }
        
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
        } else {
            $startDate = $now->copy()->startOfMonth();
            $endDate = $now->copy()->endOfMonth();
            $title = $now->format('F Y');
        }

        $allTransactionsForPeriod = $family->transactions()
            ->with('user')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();
        
        $paginatedTransactions = $family->transactions()
            ->with('user')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest()
            ->paginate(10);

        $inflow = $allTransactionsForPeriod->where('type', 'income')->sum('amount');
        $outflow = $allTransactionsForPeriod->where('type', 'expense')->sum('amount');
        $chartData = $this->prepareChartData($allTransactionsForPeriod, $period, $startDate);

        return response([
            'reportTitle' => $title,
            'familyName' => $family->first_name,
            'totalInflow' => $inflow,
            'totalOutflow' => $outflow,
            'netPosition' => $inflow - $outflow,
            'transactionCount' => $allTransactionsForPeriod->count(),
            'chartData' => $chartData,
            'transactions' => $paginatedTransactions, 
        ]);
    }

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
        
        $families = $user->families()
            ->with('owner')
            ->withSum(['transactions as totalInflow' => function ($query) {
                $query->where('type', 'income');
            }], 'amount')
            ->withSum(['transactions as totalOutflow' => function ($query) {
                $query->where('type', 'expense');
            }], 'amount')
            ->paginate(2);

        return $families->through(function ($family) {
            $inflow = $family->totalInflow ?? 0;
            $outflow = $family->totalOutflow ?? 0;
            return [
                'id' => $family->id,
                'first_name' => $family->first_name,
                'owner_name' => $family->owner->full_name,
                'totalInflow' => $inflow,
                'totalOutflow' => $outflow,
                'netPosition' => $inflow - $outflow,
            ];
        });
    }
}