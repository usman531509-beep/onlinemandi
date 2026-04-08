import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import Listing from "@/models/Listing";
import User, { UserRole } from "@/models/User";
import Broadcast from "@/models/Broadcast";
import SellRequest from "@/models/SellRequest";
import Setting from "@/models/Setting";
import Subscription from "@/models/Subscription";
import PaymentTransaction from "@/models/PaymentTransaction";

type StatsRole = UserRole;
type PopulatedPlan = {
  listingLimit?: number;
};

export const dynamic = "force-dynamic";

function getDailyDates(start: Date, end: Date) {
  const dates = [];
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (current <= last) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getMonthlyDates(start: Date, end: Date) {
  const dates = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0].substring(0, 7)); // YYYY-MM
    current.setMonth(current.getMonth() + 1);
  }
  return dates;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as StatsRole | null;
    const userId = searchParams.get("userId");

    if (!role || !userId) {
      return NextResponse.json({ ok: false, message: "role and userId are required." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
    }

    if (!["admin", "buyer", "seller"].includes(role)) {
      return NextResponse.json({ ok: false, message: "Invalid role." }, { status: 400 });
    }

    await connectToDatabase();

    const currentUser = await User.findById(userId).select("role email listingsUsedCount broadcastsUsedCount");
    if (!currentUser || currentUser.role !== role) {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    // Common Settings
    const freeListingLimitSetting = await Setting.findOne({ key: "freeListingLimit" });
    const freeListingLimit = Number(freeListingLimitSetting?.value || 5);

    if (currentUser.role === "admin") {
      const now = new Date();
      const monthParam = searchParams.get("month"); // e.g. "2024-03"
      
      let startOfMonth: Date;
      let endOfMonth: Date;

      if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
          const [y, m] = monthParam.split("-").map(Number);
          startOfMonth = new Date(y, m - 1, 1);
          endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
      } else {
          startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          endOfMonth = now; 
      }

      const startOfLast30Days = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000); 
      const startOfLast12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      const [totalUsers, openListings, pendingVerifications, revenueData, dailyRevenue, userGrowth, monthlyRevenue] = await Promise.all([
        User.countDocuments({}),
        Listing.countDocuments({}),
        User.countDocuments({
          role: "seller",
          $or: [{ assignedCategories: { $exists: false } }, { assignedCategories: { $size: 0 } }],
        }),
        PaymentTransaction.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        PaymentTransaction.aggregate([
          { 
              $match: { 
                  status: "completed", 
                  paymentDate: { $gte: startOfMonth, $lte: endOfMonth } 
              } 
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
              revenue: { $sum: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        User.aggregate([
          { $match: { createdAt: { $gte: startOfLast30Days } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              users: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        PaymentTransaction.aggregate([
          { $match: { status: "completed", paymentDate: { $gte: startOfLast12Months } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } },
              revenue: { $sum: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const revenue = revenueData.length > 0 ? revenueData[0].total : 0;

      // PADDING LOGIC: Fill in zeros for missing dates in charts
      const dailyDatesRange = getDailyDates(startOfMonth, endOfMonth);
      const paddedDailyRevenue = dailyDatesRange.map(date => ({
        _id: date,
        revenue: dailyRevenue.find(r => r._id === date)?.revenue || 0
      }));

      const growthDatesRange = getDailyDates(startOfLast30Days, now);
      const paddedUserGrowth = growthDatesRange.map(date => ({
        _id: date,
        users: userGrowth.find(g => g._id === date)?.users || 0
      }));

      const monthlyDatesRange = getMonthlyDates(startOfLast12Months, now);
      const paddedMonthlyRevenue = monthlyDatesRange.map(date => ({
        _id: date,
        revenue: monthlyRevenue.find(r => r._id === date)?.revenue || 0
      }));

      return NextResponse.json({
        ok: true,
        stats: { totalUsers, openListings, pendingVerifications, revenue },
        charts: { 
          dailyRevenue: paddedDailyRevenue, 
          userGrowth: paddedUserGrowth, 
          monthlyRevenue: paddedMonthlyRevenue 
        },
      });
    }

    if (currentUser.role === "seller") {
      const [liveListings, totalRequests, activeSubscription] = await Promise.all([
        Listing.countDocuments({ createdBy: userId }),
        SellRequest.countDocuments({ email: currentUser.email || "" }),
        Subscription.findOne({
          userEmail: currentUser.email?.toLowerCase(),
          status: "active",
          $or: [{ endDate: null }, { endDate: { $gt: new Date() } }],
        })
          .sort({ startDate: -1, createdAt: -1, _id: -1 })
          .populate("planId")
          .lean(),
      ]);

      const freeListingsUsed = currentUser.listingsUsedCount || 0;
      let paidListingsUsed = activeSubscription?.listingsUsedCount || 0;
      const plan = activeSubscription?.planId as PopulatedPlan | undefined;
      const paidListingLimit = plan?.listingLimit || 0;

      if (activeSubscription && freeListingsUsed >= freeListingLimit) {
        const paidLiveListings = await Listing.countDocuments({
          createdBy: userId,
          createdAt: { $gte: new Date(activeSubscription.startDate) },
        });

        if (paidListingsUsed < paidLiveListings) {
          await Subscription.findByIdAndUpdate(activeSubscription._id, {
            $set: { listingsUsedCount: paidLiveListings },
          });
          paidListingsUsed = paidLiveListings;
        }
      }

      return NextResponse.json({
        ok: true,
        stats: {
          liveListings,
          totalRequests,
          freeListingLimit,
          freeListingsUsed,
          paidListingsUsed,
          paidListingLimit,
        }
      });
    }

    if (currentUser.role === "buyer") {
      const [myRequirementsCount, dealsClosed, globalListings, paymentsData] = await Promise.all([
        Broadcast.countDocuments({ buyerId: userId }),
        Broadcast.countDocuments({ buyerId: userId, status: "closed" }),
        Listing.countDocuments({}),
        PaymentTransaction.aggregate([
          { $match: { userEmail: currentUser.email?.toLowerCase(), status: "completed" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ])
      ]);

      const totalSpent = paymentsData.length > 0 ? paymentsData[0].total : 0;

      // Self-healing for broadcasts
      let used = currentUser.broadcastsUsedCount || 0;
      if (used < myRequirementsCount) {
        await User.findByIdAndUpdate(userId, { $set: { broadcastsUsedCount: myRequirementsCount } });
        used = myRequirementsCount;
      }

      return NextResponse.json({
        ok: true,
        stats: {
          myRequirements: used,
          globalListings,
          dealsClosed,
          totalSpent,
          freeListingLimit
        }
      });
    }

    return NextResponse.json({ ok: false, message: "Role not handled." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to fetch dashboard stats.", error: message }, { status: 500 });
  }
}
