<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function monthly(Request $request)
    {
        $user = $request->user();
        $targetMonth = Carbon::parse($request->query('month', 'now'))->startOfMonth();

        // Data for the current report month
        $reportMonthData = $this->getMonthlyData($user, $targetMonth);

        // Data for trend analysis
        $prevMonth1 = $this->getMonthlyData($user, $targetMonth->copy()->subMonth());
        $prevMonth2 = $this->getMonthlyData($user, $targetMonth->copy()->subMonths(2));
        
        $consecutiveDecline = 0;
        if ($reportMonthData['netPosition'] < $prevMonth1['netPosition']) $consecutiveDecline++;
        if ($prevMonth1['netPosition'] < $prevMonth2['netPosition']) $consecutiveDecline++;

        return response([
            'monthName' => $targetMonth->format('F Y'),
            'totalInflow' => $reportMonthData['inflow'],
            'totalOutflow' => $reportMonthData['outflow'],
            'netPosition' => $reportMonthData['netPosition'],
            'transactionCount' => $reportMonthData['count'],
            'spendingHabit' => $reportMonthData['spendingHabit'],
            'consecutiveDecline' => $consecutiveDecline,
        ]);
    }

    private function getMonthlyData($user, Carbon $month)
    {
        $startDate = $month->copy()->startOfMonth();
        $endDate = $month->copy()->endOfMonth();

        $transactions = $user->transactions()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $inflow = $transactions->where('type', 'income')->sum('amount');
        $outflow = $transactions->where('type', 'expense')->sum('amount');

        // Find the day and time with the most spending
        $spendingHabit = DB::table('transactions')
            ->select(
                DB::raw("DAYNAME(created_at) as day"),
                DB::raw("CASE 
                    WHEN HOUR(created_at) BETWEEN 5 AND 11 THEN 'Morning'
                    WHEN HOUR(created_at) BETWEEN 12 AND 17 THEN 'Afternoon'
                    WHEN HOUR(created_at) BETWEEN 18 AND 22 THEN 'Evening'
                    ELSE 'Night'
                END as time_of_day"),
                DB::raw("COUNT(*) as count")
            )
            ->where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('day', 'time_of_day')
            ->orderByDesc('count')
            ->first();

        return [
            'inflow' => $inflow,
            'outflow' => $outflow,
            'netPosition' => $inflow - $outflow,
            'count' => $transactions->count(),
            'spendingHabit' => $spendingHabit ? "The highest frequency of spending occurred on {$spendingHabit->day}s during the {$spendingHabit->time_of_day}." : "Insufficient data for spending habit analysis.",
        ];
    }
}