import api from './api';
import { normalizeTransaction } from './transactionService';

class ReportService {
  // Laporan Penjualan (Admin)
  async getSalesReport(params = {}) {
    const query = {
      ...(params.startDate ? { start_date: params.startDate } : {}),
      ...(params.endDate ? { end_date: params.endDate } : {}),
      ...(params.month ? { month: params.month } : {}),
      ...(params.year ? { year: params.year } : {}),
    };

    const res = await api.get('/reports/sales', { params: query });
    return res.data || res;
  }

  // Laporan Penambahan Stok (Admin)
  async getStocksReport(params = {}) {
    const query = {
      ...(params.startDate ? { start_date: params.startDate } : {}),
      ...(params.endDate ? { end_date: params.endDate } : {}),
      ...(params.productId ? { product_id: params.productId } : {}),
    };

    const res = await api.get('/reports/stocks', { params: query });
    return res.data || res;
  }

  // Laporan Perkiraan Laba (Admin)
  async getProfitReport(params = {}) {
    const query = {
      ...(params.startDate ? { start_date: params.startDate } : {}),
      ...(params.endDate ? { end_date: params.endDate } : {}),
      ...(params.month ? { month: params.month } : {}),
      ...(params.year ? { year: params.year } : {}),
    };

    const res = await api.get('/reports/profit', { params: query });
    return res.data || res;
  }

  // Laporan Bulanan Terpadu (menggabungkan data penjualan & laba untuk rekap Kop Surat)
  async generateMonthlyReport({ year, month, startDate, endDate }) {
    let start = startDate;
    let end = endDate;

    if (year !== undefined && month !== undefined) {
      start = new Date(year, month, 1).toISOString().slice(0, 10);
      end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    }

    try {
      const [salesRes, profitRes] = await Promise.allSettled([
        this.getSalesReport({ startDate: start, endDate: end }),
        this.getProfitReport({ startDate: start, endDate: end }),
      ]);

      const salesData = salesRes.status === 'fulfilled' ? salesRes.value?.data || salesRes.value : {};
      const profitData = profitRes.status === 'fulfilled' ? profitRes.value?.data || profitRes.value : {};

      const transactions =
        salesData.sales || salesData.transactions || [];

      const totalRevenue = Number(
        profitData.summary?.totalSales ??
          salesData.summary?.totalRevenue ??
          profitData.total_revenue ??
          transactions.reduce((acc, t) => acc + (Number(t.total) || Number(t.grandTotal) || 0), 0)
      );

      const totalCost = Number(
        profitData.summary?.totalCost ??
          profitData.total_cost ??
          0
      );

      const netProfit = Number(
        profitData.summary?.totalProfit ??
          profitData.net_profit ??
          totalRevenue - totalCost
      );

      const profitMargin =
        totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

      const totalItemsSold = Number(
        salesData.summary?.totalItemsSold ??
          transactions.reduce((acc, t) => acc + (t.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0), 0)
      );

      const normTransactions = transactions.map((t) => {
        const norm = normalizeTransaction(t);
        return {
          ...norm,
          cashierName: norm.cashierName || 'Kasir',
        };
      });

        const paymentMethodsSummary = {
          Cash: { count: 0, total: 0 },
          QRIS: { count: 0, total: 0 },
          Transfer: { count: 0, total: 0 },
        };

        normTransactions.forEach((t) => {
          const method = t.paymentMethod || 'Cash';
          if (paymentMethodsSummary[method]) {
            paymentMethodsSummary[method].count += 1;
            paymentMethodsSummary[method].total += Number(t.grandTotal || 0);
          } else {
            paymentMethodsSummary.Cash.count += 1;
            paymentMethodsSummary.Cash.total += Number(t.grandTotal || 0);
          }
        });

        return {
          summary: {
            totalRevenue,
            totalCost,
            netProfit,
            profitMargin,
            totalTransactions: transactions.length || Number(salesData.summary?.totalTransactions || 0),
            totalItemsSold: totalItemsSold,
            avgTransactionValue:
              transactions.length > 0 ? Math.round(totalRevenue / transactions.length) : 0,
          },
          transactions: normTransactions,
          paymentMethods: paymentMethodsSummary,
          topProducts: (profitData.products || []).map((p) => ({
            name: p.productName || p.name,
            soldCount: p.totalSold || 0,
            revenue: p.totalSales || 0,
            profit: p.estimatedProfit || 0,
          })),
        cashierPerformance: salesData.cashier_performance || [],
        inventory: {
          totalProducts: salesData.inventory_total_products || 0,
          totalAssetValue: salesData.inventory_asset_value || 0,
          totalRetailValue: salesData.inventory_retail_value || 0,
        },
      };
    } catch (error) {
      console.error('Error generating monthly report from backend:', error);
      throw error;
    }
  }
  // Dashboard Metrics Calculation
  getDashboardMetrics(products = [], transactions = []) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = new Date().toISOString().slice(0, 7);

    // Today Transactions
    const todayTrx = (transactions || []).filter((t) => t.createdAt && t.createdAt.startsWith(todayStr));
    const todayRevenue = todayTrx.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
    const todayCost = todayTrx.reduce((sum, t) => sum + (t.totalCost || 0), 0);
    const todayProfit = todayRevenue - todayCost;

    // This Month Transactions
    const monthTrx = (transactions || []).filter((t) => t.createdAt && t.createdAt.startsWith(thisMonthStr));
    const monthRevenue = monthTrx.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
    const monthCost = monthTrx.reduce((sum, t) => sum + (t.totalCost || 0), 0);
    const monthProfit = monthRevenue - monthCost;

    // Inventory status
    const lowStockList = (products || []).filter((p) => p.stock <= p.minStock && p.stock > 0);
    const outOfStockList = (products || []).filter((p) => p.stock <= 0);

    // Last 7 Days
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayTrx = (transactions || []).filter((t) => t.createdAt && t.createdAt.startsWith(dateStr));
      const dayRevenue = dayTrx.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
      const dayCost = dayTrx.reduce((sum, t) => sum + (t.totalCost || 0), 0);
      last7Days.push({
        date: dateStr,
        dayName: dayNames[d.getDay()],
        revenue: dayRevenue,
        profit: dayRevenue - dayCost,
        count: dayTrx.length,
      });
    }

    // Top Selling Products Calculation from transactions
    const productSalesMap = {};
    (transactions || []).forEach((t) => {
      const items = t.items || t.saleItems || t.SaleItems || t.details || [];
      items.forEach((item) => {
        const pId = item.productId || item.product_id || item.id || item.name;
        const pName = item.productName || item.product_name || item.name || 'Barang';
        const pCategory = item.category || item.product?.category || 'Umum';
        const qty = Number(item.quantity || item.qty || 1);
        const subtotal = Number(item.subtotal || ((Number(item.price || item.sellPrice || item.selling_price || 0)) * qty) || 0);

        if (!productSalesMap[pId]) {
          productSalesMap[pId] = {
            id: pId,
            name: pName,
            category: pCategory,
            soldCount: 0,
            revenue: 0,
          };
        }
        productSalesMap[pId].soldCount += qty;
        productSalesMap[pId].revenue += subtotal;
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5);

    return {
      today: {
        revenue: todayRevenue,
        profit: todayProfit,
        count: todayTrx.length,
      },
      month: {
        revenue: monthRevenue,
        profit: monthProfit,
        count: monthTrx.length,
      },
      inventory: {
        totalProducts: products.length,
        lowStockList: [...outOfStockList, ...lowStockList],
        lowStockCount: lowStockList.length + outOfStockList.length,
        outOfStockCount: outOfStockList.length,
      },
      last7Days,
      topProducts,
      recentTransactions: (transactions || []).slice(0, 5),
    };
  }
}

export const reportService = new ReportService();
export default reportService;
