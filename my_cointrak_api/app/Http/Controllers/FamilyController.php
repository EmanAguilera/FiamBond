<?php

namespace App\Http\Controllers;

use App\Models\Family;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

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
        
        if (Gate::denies('update-family', $family)) {
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
        if (Gate::denies('update-family', $family)) {
            return response(['message' => 'Only the family owner can perform this action.'], 403);
        }

        if ($family->members()->where('user_id', '!=', $family->owner_id)->exists()) {
            return response(['message' => 'Cannot rename a family that has other members.'], 403);
        }

        $fields = $request->validate([
            'first_name' => 'required|string|max:255'
        ]);

        $family->update($fields);

        return response($family);
    }

    public function destroy(Family $family)
    {
        if (Gate::denies('update-family', $family)) {
            return response(['message' => 'Only the family owner can perform this action.'], 403);
        }

        if ($family->members()->where('user_id', '!=', $family->owner_id)->exists()) {
            return response(['message' => 'You must remove all other members before deleting this family.'], 403);
        }

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