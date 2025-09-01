<?php

namespace App\Http\Controllers;

use App\Models\Transaction; // <-- 1. Add this import
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

        // --- START OF FIX ---
        // 2. Get the IDs of all families the user is a member of.
        $familyIds = $user->families()->pluck('id')->toArray();

        // 3. Build a new query to get ALL relevant transactions.
        $transactions = Transaction::query() // Use the Transaction model to start a new query
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where(function ($query) use ($user, $familyIds) {
                // Condition 1: Get their personal transactions (user_id matches, but no family_id)
                $query->where('user_id', $user->id)
                      ->whereNull('family_id');
                
                // Condition 2: OR get any transactions from their families
                $query->orWhereIn('family_id', $familyIds);
            })
            ->get();
        // --- END OF FIX ---


        $inflow = $transactions->where('type', 'income')->sum('amount');
        $outflow = $transactions->where('type', 'expense')->sum('amount');

        // The rest of this function (spending habit logic) remains the same
        $spendingHabits = [];
        $expenseTransactions = $transactions->where('type', 'expense');

        if ($expenseTransactions->isNotEmpty()) {
            foreach ($expenseTransactions as $transaction) {
                $date = Carbon::parse($transaction->created_at);
                $day = $date->format('l');
                $hour = $date->hour;

                if ($hour >= 5 && $hour <= 11) $timeOfDay = 'Morning';
                elseif ($hour >= 12 && $hour <= 17) $timeOfDay = 'Afternoon';
                elseif ($hour >= 18 && $hour <= 22) $timeOfDay = 'Evening';
                else $timeOfDay = 'Night';

                $key = "{$day}-{$timeOfDay}";
                if (!isset($spendingHabits[$key])) {
                    $spendingHabits[$key] = 0;
                }
                $spendingHabits[$key]++;
            }
            
            arsort($spendingHabits);
            $mostCommonHabit = key($spendingHabits);
            list($habitDay, $habitTime) = explode('-', $mostCommonHabit);
            $spendingHabitMessage = "The highest frequency of spending occurred on {$habitDay}s during the {$habitTime}.";

        } else {
            $spendingHabitMessage = "Insufficient data for spending habit analysis.";
        }


        return [
            'inflow' => $inflow,
            'outflow' => $outflow,
            'netPosition' => $inflow - $outflow,
            'count' => $transactions->count(),
            'spendingHabit' => $spendingHabitMessage,
        ];
    }
}