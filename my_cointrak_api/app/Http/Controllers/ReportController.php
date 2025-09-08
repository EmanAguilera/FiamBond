<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    /**
     * Generate a financial report for the authenticated user.
     */
    public function generateMonthlyReport(Request $request)
    {
        $user = $request->user();
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

        // --- START OF FIX ---
        // Fetch ALL transactions belonging to the user for the target period,
        // including both personal (family_id is null) and family transactions.
        $transactions = $user->transactions()
        ->whereNull('family_id') // Add this line
        ->whereBetween('created_at', [$startDate, $endDate])
        ->get();
        // --- END OF FIX ---

        $inflow = $transactions->where('type', 'income')->sum('amount');
        $outflow = $transactions->where('type', 'expense')->sum('amount');

        // Prepare data for the bar chart
        $chartData = $this->prepareChartData($transactions, $period, $startDate);

        return response([
            'reportTitle' => $title,
            'totalInflow' => $inflow,
            'totalOutflow' => $outflow,
            'netPosition' => $inflow - $outflow,
            'transactionCount' => $transactions->count(),
            'chartData' => $chartData,
            'transactions' => $transactions, // For potential detailed views
        ]);
    }

    /**
     * Helper function to format transaction data for chart.js.
     * This is the same helper from FamilyController for consistency.
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
}