import { MEANINGFUL_CONTACT_STATUSES } from "../lead/lead.constant";
import { LeadModel } from "../lead/lead.model";
import { SearchGroupModel } from "../searchGroup/searchGroup.model";
import {
  getModeratorTargetsForDate,
  getTargetForDate,
  settingsService,
} from "../settings/settings.service";
import {
  TAdminDashboardResponse,
  TAdminTimeframe,
  TModeratorDashboardResponse,
  TTrendBucket,
} from "./dashboard.types";

/**
 * Matches leads that represent a meaningful contact (customer actually reached/dealt with),
 * explicitly excluding unanswered 'called', 'invalid', and 'uncontacted' statuses.
 */
const buildMeaningfulContactMatch = (start: number, end: number) => ({
  status: { $in: [...MEANINGFUL_CONTACT_STATUSES] },
  $or: [
    { lastMeaningfulContactAt: { $gte: start, $lte: end } },
    {
      lastMeaningfulContactAt: null,
      lastContactedAt: { $gte: start, $lte: end },
    },
    {
      lastMeaningfulContactAt: null,
      lastContactedAt: null,
      updatedAt: { $gte: start, $lte: end },
    },
  ],
});

/**
 * Matches any dial/outreach attempt (including unanswered 'called' and 'invalid').
 */
const buildAttemptMatch = (start: number, end: number) => ({
  status: { $nin: ["uncontacted", null] },
  $or: [
    { lastContactedAt: { $gte: start, $lte: end } },
    { "notes.createdAt": { $gte: start, $lte: end } },
  ],
});

/**
 * Counts how many active moderators existed on or before a given day's end timestamp.
 */
const getModeratorCountForDate = (
  endTimestamp: number,
  moderators: Array<{ createdAt?: Date | string | number }>,
): number => {
  const count = moderators.filter((m) => {
    if (!m.createdAt) return true;
    const createdMs =
      m.createdAt instanceof Date
        ? m.createdAt.getTime()
        : typeof m.createdAt === "number"
          ? m.createdAt
          : new Date(m.createdAt).getTime();
    return !isNaN(createdMs) ? createdMs <= endTimestamp : true;
  }).length;
  return Math.max(1, count);
};

interface BucketConfig {
  key: string;
  label: string;
  subLabel: string;
  start: number;
  end: number;
  isCurrent?: boolean;
}

const buildTimeframeBucketConfigs = (
  timeframe: TAdminTimeframe,
  now: Date,
): BucketConfig[] => {
  if (timeframe === "7d") {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const end = start + 86400000 - 1;
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const isToday = i === 6;

      return {
        key: `day7_${i}`,
        label: isToday ? "Today" : dayName,
        subLabel: dayLabel,
        start,
        end,
        isCurrent: isToday,
      };
    });
  }

  if (timeframe === "1m") {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const end = start + 86400000 - 1;
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString("en-US", { month: "short" });
      const isToday = i === 29;

      return {
        key: `day30_${i}`,
        label: isToday ? "Today" : `${monthShort} ${dayNum}`,
        subLabel: `${dayNum}`,
        start,
        end,
        isCurrent: isToday,
      };
    });
  }

  if (timeframe === "3m") {
    // 12 Weeks
    return Array.from({ length: 12 }, (_, i) => {
      const daysBackStart = (11 - i) * 7;
      const daysBackEnd = daysBackStart - 6;

      const dStart = new Date(now);
      dStart.setDate(dStart.getDate() - daysBackStart);
      const start = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate(), 0, 0, 0, 0).getTime();

      const dEnd = new Date(now);
      dEnd.setDate(dEnd.getDate() - (daysBackEnd > 0 ? daysBackEnd : 0));
      const end = new Date(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate(), 23, 59, 59, 999).getTime();

      const isCurrent = i === 11;
      const startFmt = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endFmt = dEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      return {
        key: `week12_${i}`,
        label: isCurrent ? "This Wk" : `W${i + 1}`,
        subLabel: `${startFmt} - ${endFmt}`,
        start,
        end,
        isCurrent,
      };
    });
  }

  if (timeframe === "6m") {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const start = d.getTime();
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const end = nextMonth.getTime() - 1;

      const monthName = d.toLocaleDateString("en-US", { month: "short" });
      const yearStr = d.getFullYear().toString();
      const isCurrent = i === 5;

      return {
        key: `month6_${i}`,
        label: isCurrent ? `${monthName} (Now)` : monthName,
        subLabel: yearStr,
        start,
        end,
        isCurrent,
      };
    });
  }

  // 1y = 12 Months
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const start = d.getTime();
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const end = nextMonth.getTime() - 1;

    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    const yearStr = d.getFullYear().toString().slice(-2);
    const isCurrent = i === 11;

    return {
      key: `month12_${i}`,
      label: isCurrent ? `${monthName} (Now)` : monthName,
      subLabel: `'${yearStr}`,
      start,
      end,
      isCurrent,
    };
  });
};

const getAdminDashboardData = async (
  timeframe: TAdminTimeframe = "7d",
): Promise<TAdminDashboardResponse> => {
  const settings = await settingsService.getSettings();
  const dailyTarget = settings.dailyApproachTarget || 25;
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const endOfToday = startOfToday + 86400000 - 1;
  const startOfYesterday = startOfToday - 86400000;
  const endOfYesterday = startOfToday - 1;

  const bucketConfigs = buildTimeframeBucketConfigs(timeframe, now);

  // Database-driven bucket facets (only Meaningful Contacts count toward target)
  const bucketFacets: Record<string, any[]> = {};
  bucketConfigs.forEach((b) => {
    bucketFacets[b.key] = [
      { $match: buildMeaningfulContactMatch(b.start, b.end) },
      { $count: "count" },
    ];
  });

  // Run comprehensive MongoDB aggregation pipeline + fetch active moderators with createdAt
  const [aggregationResult, totalSearchClusters, activeModerators] = await Promise.all([
    LeadModel.aggregate([
      {
        $facet: {
          // 1. Velocity Today & Yesterday (Meaningful Contacts)
          todayTouches: [
            { $match: buildMeaningfulContactMatch(startOfToday, endOfToday) },
            { $count: "count" },
          ],
          yesterdayTouches: [
            { $match: buildMeaningfulContactMatch(startOfYesterday, endOfYesterday) },
            { $count: "count" },
          ],

          // 2. High-level KPI Summary
          kpiSummary: [
            {
              $group: {
                _id: null,
                totalLeads: { $sum: 1 },
                verifiedCount: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $gt: [{ $strLenCP: { $ifNull: ["$phone", ""] } }, 0] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$email", ""] } }, 0] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                prospectsWithoutWebsite: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $eq: ["$website", ""] },
                          { $eq: ["$website", null] },
                          { $not: ["$website"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                enrichedSocialCount: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $gt: [{ $strLenCP: { $ifNull: ["$facebook", ""] } }, 0] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$instagram", ""] } }, 0] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$linkedin", ""] } }, 0] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$whatsapp", ""] } }, 0] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],

          // 3. Funnel Stages Breakdown
          stageStats: [
            {
              $group: {
                _id: { $ifNull: ["$status", "uncontacted"] },
                count: { $sum: 1 },
              },
            },
          ],

          // 4. Platform Footprint Breakdown
          platformFootprint: [
            {
              $group: {
                _id: { $toLower: { $ifNull: ["$source", "other"] } },
                count: { $sum: 1 },
              },
            },
          ],

          // 5. Dynamic Timeframe Buckets
          ...bucketFacets,

          // 6. Moderator Leaderboard Multi-Metric Touches Today
          moderatorTouchesToday: [
            { $match: buildAttemptMatch(startOfToday, endOfToday) },
            {
              $group: {
                _id: {
                  $ifNull: [
                    "$lastContactedBy.userId",
                    { $ifNull: ["$assignedTo.userId", "unassigned"] },
                  ],
                },
                name: {
                  $first: {
                    $ifNull: [
                      "$lastContactedBy.name",
                      { $ifNull: ["$assignedTo.name", "Moderator"] },
                    ],
                  },
                },
                email: {
                  $first: {
                    $ifNull: [
                      "$lastContactedBy.email",
                      { $ifNull: ["$assignedTo.email", ""] },
                    ],
                  },
                },
                attemptsToday: { $sum: 1 },
                meaningfulContactsToday: {
                  $sum: {
                    $cond: [
                      { $in: ["$status", [...MEANINGFUL_CONTACT_STATUSES]] },
                      1,
                      0,
                    ],
                  },
                },
                qualifiedToday: {
                  $sum: {
                    $cond: [
                      { $in: ["$status", ["interested", "converted"]] },
                      1,
                      0,
                    ],
                  },
                },
                convertedToday: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "converted"] }, 1, 0],
                  },
                },
              },
            },
          ],

          // 7. Deal Value Pipeline
          dealPipeline: [
            {
              $group: {
                _id: null,
                totalPipelineValue: { $sum: { $ifNull: ["$dealValue", 0] } },
                closedWonValue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "converted"] },
                      { $ifNull: ["$dealValue", 0] },
                      0,
                    ],
                  },
                },
                activeDealsValue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "interested"] },
                      { $ifNull: ["$dealValue", 0] },
                      0,
                    ],
                  },
                },
              },
            },
          ],

          // 8. Top Performing Search Queries
          topSearchQueries: [
            {
              $group: {
                _id: "$searchQuery",
                totalLeads: { $sum: 1 },
                convertedLeads: {
                  $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
                },
              },
            },
            { $sort: { totalLeads: -1 } },
            { $limit: 5 },
          ],

          // 9. Recent Leads
          recentLeads: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]),
    SearchGroupModel.countDocuments(),
    LeadModel.db
      .collection("user")
      .find({ role: "moderator", banned: { $ne: true } })
      .project({ createdAt: 1 })
      .toArray(),
  ]);

  const raw = aggregationResult[0] || {};
  const moderatorCount = getModeratorCountForDate(endOfToday, activeModerators);
  const yesterdayModeratorCount = getModeratorCountForDate(endOfYesterday, activeModerators);

  // Velocity Metrics (Team Target = Active Moderators on that day × Per-Moderator Target)
  const perModeratorTarget = getTargetForDate(startOfToday, settings.targetHistory, dailyTarget);
  const todayTarget = perModeratorTarget * moderatorCount;
  const yesterdayTarget =
    getTargetForDate(startOfYesterday, settings.targetHistory, dailyTarget) *
    yesterdayModeratorCount;
  const teamBaseDailyTarget = dailyTarget * moderatorCount;
  const todayCount = raw.todayTouches?.[0]?.count || 0;
  const yesterdayCount = raw.yesterdayTouches?.[0]?.count || 0;
  const progressPercent = Math.min(100, Math.round((todayCount / (todayTarget || 1)) * 100));

  // KPI Summary
  const kpiData = raw.kpiSummary?.[0] || {
    totalLeads: 0,
    verifiedCount: 0,
    prospectsWithoutWebsite: 0,
    enrichedSocialCount: 0,
  };
  const totalLeads = kpiData.totalLeads || 0;
  const verifiedCount = kpiData.verifiedCount || 0;
  const conversionRate = Math.round((verifiedCount / (totalLeads || 1)) * 100);
  const prospectsWithoutWebsite = kpiData.prospectsWithoutWebsite || 0;
  const prospectsWithoutWebsitePercent = Math.round(
    (prospectsWithoutWebsite / (totalLeads || 1)) * 100,
  );
  const enrichedSocialCount = kpiData.enrichedSocialCount || 0;
  const enrichedSocialPercent = Math.round(
    (enrichedSocialCount / (totalLeads || 1)) * 100,
  );

  // Funnel Stages
  const stagesMap: Record<string, number> = {
    uncontacted: 0,
    called: 0,
    call_later: 0,
    interested: 0,
    converted: 0,
    not_interested: 0,
    invalid: 0,
  };
  (raw.stageStats || []).forEach((item: { _id: string; count: number }) => {
    if (stagesMap[item._id] !== undefined) {
      stagesMap[item._id] = item.count;
    } else {
      stagesMap.uncontacted += item.count;
    }
  });

  const contactedCount = totalLeads - stagesMap.uncontacted;
  const activeNegotiation = stagesMap.called + stagesMap.call_later;
  const pipelineDeals = stagesMap.interested + stagesMap.converted;

  // Platform Footprint
  let googleMaps = 0;
  let instagramFacebook = 0;
  let linkedin = 0;
  let otherPlatforms = 0;

  (raw.platformFootprint || []).forEach((item: { _id: string; count: number }) => {
    const src = (item._id || "").toLowerCase();
    if (src.includes("google")) {
      googleMaps += item.count;
    } else if (src.includes("instagram") || src.includes("facebook")) {
      instagramFacebook += item.count;
    } else if (src.includes("linkedin")) {
      linkedin += item.count;
    } else {
      otherPlatforms += item.count;
    }
  });

  // Timeframe Benchmark Configuration (Team Target = perModerator × moderatorCount)
  let periodBenchmark = teamBaseDailyTarget;
  let benchmarkUnitLabel = "day";
  let title = "7-Day Team Outreach Volume vs. Configured Target Benchmark";
  let description = `Continuous benchmark reference line set to ${teamBaseDailyTarget} meaningful contacts/day (${moderatorCount} moderator${moderatorCount === 1 ? "" : "s"} × ${dailyTarget}/day).`;

  if (timeframe === "1m") {
    periodBenchmark = teamBaseDailyTarget;
    benchmarkUnitLabel = "day";
    title = "30-Day Team Outreach Volume & Daily Consistency Trend";
    description = `Tracking day-by-day meaningful contacts across the past 30 days against the ${teamBaseDailyTarget}/day team benchmark.`;
  } else if (timeframe === "3m") {
    periodBenchmark = teamBaseDailyTarget * 5;
    benchmarkUnitLabel = "week";
    title = "3-Month Team Outreach Cadence & Weekly Attainment";
    description = `Aggregated across 12 weekly periods against a 5-day weekly target of ${periodBenchmark} contacts/week.`;
  } else if (timeframe === "6m") {
    periodBenchmark = teamBaseDailyTarget * 22;
    benchmarkUnitLabel = "month";
    title = "6-Month Outreach Velocity & Monthly Performance";
    description = `Tracking total monthly meaningful contacts across the past 6 months against an estimated monthly benchmark of ${periodBenchmark}.`;
  } else if (timeframe === "1y") {
    periodBenchmark = teamBaseDailyTarget * 22;
    benchmarkUnitLabel = "month";
    title = "1-Year Comprehensive Outreach & Pipeline Growth Trend";
    description = `Full 12-month historical outreach view across the workspace with ${periodBenchmark} contacts/month reference benchmark.`;
  }

  // Construct Buckets with Database Counts
  const buckets: TTrendBucket[] = bucketConfigs.map((b) => {
    const count = raw[b.key]?.[0]?.count || 0;
    const bucketModCount = getModeratorCountForDate(b.end, activeModerators);

    let bucketTarget = periodBenchmark;
    if (timeframe === "7d" || timeframe === "1m") {
      bucketTarget = getTargetForDate(b.start, settings.targetHistory, dailyTarget) * bucketModCount;
    } else if (timeframe === "3m") {
      bucketTarget = getTargetForDate(b.start, settings.targetHistory, dailyTarget) * bucketModCount * 5;
    } else if (timeframe === "6m" || timeframe === "1y") {
      bucketTarget = getTargetForDate(b.start, settings.targetHistory, dailyTarget) * bucketModCount * 22;
    }

    const progressPercent = Math.round((count / (bucketTarget || 1)) * 100);
    const metTarget = count >= bucketTarget;

    const unitDesc = timeframe === "7d" || timeframe === "1m" ? "target" : "benchmark";
    const statusDesc = metTarget ? "Target Met" : "Below Target";
    const tooltipText = `${b.label}: ${count} / ${bucketTarget} touches (${progressPercent}% of ${unitDesc} • ${statusDesc})`;

    return {
      key: b.key,
      label: b.label,
      subLabel: b.subLabel,
      count,
      target: bucketTarget,
      progressPercent,
      metTarget,
      isCurrent: b.isCurrent,
      tooltipText,
    };
  });

  const totalTouchpoints = buckets.reduce((acc, b) => acc + b.count, 0);
  const divisor = buckets.length || 1;
  const periodAverage = Math.round((totalTouchpoints / divisor) * 10) / 10;
  const maxBucketValue = Math.max(periodBenchmark * 1.3, ...buckets.map((b) => b.count), ...buckets.map((b) => b.target), 1);

  // Metric pills
  let metric1Label = "Today's Workspace Touches";
  let metric1Value = todayCount;
  let metric1Sub = `${Math.round((todayCount / (todayTarget || 1)) * 100)}% of daily target (${todayCount} / ${todayTarget})`;

  let metric2Label = "Yesterday's Completed";
  let metric2Value = yesterdayCount;
  let metric2Sub =
    yesterdayCount >= yesterdayTarget
      ? `✓ Target met (${yesterdayCount} / ${yesterdayTarget})`
      : `${yesterdayTarget - yesterdayCount} below target (${yesterdayCount} / ${yesterdayTarget})`;

  let metric4Label = `${timeframe.toUpperCase()} Daily Average`;
  let metric4Sub = `Benchmark: ${periodBenchmark} / ${benchmarkUnitLabel}`;

  if (timeframe === "1m") {
    const daysMet = buckets.filter((b) => b.metTarget).length;
    metric1Label = "Days Target Met (Past 30D)";
    metric1Value = daysMet;
    metric1Sub = `${Math.round((daysMet / 30) * 100)}% consistency rate (${daysMet} / 30 days)`;

    const peakDay = [...buckets].sort((a, b) => b.count - a.count)[0];
    metric2Label = "Peak Outreach Day";
    metric2Value = peakDay ? peakDay.count : 0;
    metric2Sub = peakDay ? `Peak on ${peakDay.label}` : "None recorded";

    metric4Label = "30-Day Daily Average";
    metric4Sub = `Benchmark: ${dailyTarget} / day`;
  } else if (timeframe === "3m") {
    const weeksMet = buckets.filter((b) => b.metTarget).length;
    metric1Label = "Weeks Quota Achieved";
    metric1Value = weeksMet;
    metric1Sub = `${Math.round((weeksMet / 12) * 100)}% weekly attainment (${weeksMet} / 12 wks)`;

    const peakWk = [...buckets].sort((a, b) => b.count - a.count)[0];
    metric2Label = "Peak Weekly Volume";
    metric2Value = peakWk ? peakWk.count : 0;
    metric2Sub = peakWk ? `${peakWk.subLabel}` : "None recorded";

    metric4Label = "Weekly Outreach Average";
    metric4Sub = `Benchmark: ${periodBenchmark} / week`;
  } else if (timeframe === "6m") {
    const monthsMet = buckets.filter((b) => b.metTarget).length;
    metric1Label = "Months Quota Achieved";
    metric1Value = monthsMet;
    metric1Sub = `${Math.round((monthsMet / 6) * 100)}% monthly attainment (${monthsMet} / 6 mos)`;

    const peakMo = [...buckets].sort((a, b) => b.count - a.count)[0];
    metric2Label = "Peak Monthly Volume";
    metric2Value = peakMo ? peakMo.count : 0;
    metric2Sub = peakMo ? `${peakMo.label} ${peakMo.subLabel}` : "None recorded";

    metric4Label = "Monthly Outreach Average";
    metric4Sub = `Benchmark: ${periodBenchmark} / month`;
  } else if (timeframe === "1y") {
    const monthsMet = buckets.filter((b) => b.metTarget).length;
    metric1Label = "Months Quota Achieved";
    metric1Value = monthsMet;
    metric1Sub = `${Math.round((monthsMet / 12) * 100)}% annual consistency (${monthsMet} / 12 mos)`;

    const peakYrMo = [...buckets].sort((a, b) => b.count - a.count)[0];
    metric2Label = "Peak Monthly Volume";
    metric2Value = peakYrMo ? peakYrMo.count : 0;
    metric2Sub = peakYrMo ? `${peakYrMo.label} ${peakYrMo.subLabel}` : "None recorded";

    metric4Label = "Annual Monthly Average";
    metric4Sub = `Benchmark: ${periodBenchmark} / month`;
  }

  // Moderator Leaderboard formatting with per-moderator multi-metric targets
  const moderatorLeaderboard = (raw.moderatorTouchesToday || []).map(
    (item: {
      _id: string;
      name: string;
      email: string;
      attemptsToday: number;
      meaningfulContactsToday: number;
      qualifiedToday: number;
      convertedToday: number;
    }) => {
      const attempts = item.attemptsToday || 0;
      const contacts = item.meaningfulContactsToday || 0;
      const qualified = item.qualifiedToday || 0;
      const converted = item.convertedToday || 0;
      const reachRate = attempts > 0 ? Math.round((contacts / attempts) * 100) : 0;

      const targets = getModeratorTargetsForDate(item._id, startOfToday, settings);
      const individualTarget = perModeratorTarget;
      const pct = Math.min(
        100,
        Math.round((contacts / (individualTarget || 1)) * 100),
      );

      return {
        userId: item._id,
        name: item.name || "Moderator",
        email: item.email || "",
        role: "moderator",
        todayTouches: contacts,
        attemptsToday: attempts,
        meaningfulContactsToday: contacts,
        qualifiedToday: qualified,
        convertedToday: converted,
        reachRate,
        targets: {
          ...targets,
          dailyContactTarget: individualTarget,
        },
        progressPercent: pct,
        isMet: contacts >= individualTarget,
        toGo: Math.max(0, individualTarget - contacts),
      };
    },
  );

  // Deal Pipeline Summary
  const dealsRaw = raw.dealPipeline?.[0] || {};
  const dealPipeline = {
    totalPipelineValue: dealsRaw.totalPipelineValue || 0,
    closedWonValue: dealsRaw.closedWonValue || 0,
    activeDealsValue: dealsRaw.activeDealsValue || 0,
  };

  // Top Search Queries
  const topSearchQueries = (raw.topSearchQueries || []).map(
    (item: { _id: string; totalLeads: number; convertedLeads: number }) => ({
      query: item._id || "Unknown query",
      totalLeads: item.totalLeads || 0,
      convertedLeads: item.convertedLeads || 0,
    }),
  );

  // Recent Leads & Activities
  const recentLeads = raw.recentLeads || [];
  const recentActivities = recentLeads.map((l: any, i: number) => ({
    id: `act-${l.leadId || i}`,
    leadName: l.name,
    searchQuery: l.searchQuery,
    timestamp: l.createdAt,
    action: "captured",
    source: l.source,
  }));

  return {
    timeframe,
    dailyTarget: todayTarget,
    perModeratorTarget,
    moderatorCount,
    velocity: {
      todayCount,
      yesterdayCount,
      dailyTarget: todayTarget,
      progressPercent,
      isTargetMet: todayCount >= todayTarget,
      differenceFromYesterday: todayCount - yesterdayCount,
    },
    kpiSummary: {
      totalLeads,
      totalSearchClusters,
      verifiedCount,
      conversionRate,
      prospectsWithoutWebsite,
      prospectsWithoutWebsitePercent,
      enrichedSocialCount,
      enrichedSocialPercent,
    },
    funnelStages: {
      uncontacted: stagesMap.uncontacted,
      called: stagesMap.called,
      call_later: stagesMap.call_later,
      interested: stagesMap.interested,
      converted: stagesMap.converted,
      not_interested: stagesMap.not_interested,
      invalid: stagesMap.invalid,
      pipelineDeals,
      contactRate: Math.round((contactedCount / (totalLeads || 1)) * 100),
      activeNegotiationRate: Math.round((activeNegotiation / (totalLeads || 1)) * 100),
      dealProposalRate: Math.round((stagesMap.interested / (totalLeads || 1)) * 100),
      winRate: Math.round((stagesMap.converted / (totalLeads || 1)) * 100),
    },
    platformFootprint: {
      googleMaps,
      instagramFacebook,
      linkedin,
      other: otherPlatforms,
    },
    trendAnalytics: {
      timeframe,
      periodBenchmark,
      benchmarkUnitLabel,
      title,
      description,
      buckets,
      totalTouchpoints,
      periodAverage,
      maxBucketValue,
      metric1Label,
      metric1Value,
      metric1Sub,
      metric2Label,
      metric2Value,
      metric2Sub,
      metric4Label,
      metric4Sub,
    },
    moderatorLeaderboard,
    dealPipeline,
    topSearchQueries,
    recentLeads,
    recentActivities,
  };
};

const getModeratorDashboardData = async (
  userId?: string,
): Promise<TModeratorDashboardResponse> => {
  const settings = await settingsService.getSettings();
  const dailyTarget = settings.dailyApproachTarget || 25;
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const endOfToday = startOfToday + 86400000 - 1;
  const startOfYesterday = startOfToday - 86400000;
  const endOfYesterday = startOfToday - 1;

  const userFilter = userId
    ? {
        $or: [
          { "lastContactedBy.userId": userId },
          { "assignedTo.userId": userId },
          { "notes.createdBy.userId": userId },
        ],
      }
    : null;

  const moderatorAttemptsMatch: any = userFilter
    ? { $and: [buildAttemptMatch(startOfToday, endOfToday), userFilter] }
    : buildAttemptMatch(startOfToday, endOfToday);

  const moderatorMeaningfulMatch: any = userFilter
    ? { $and: [buildMeaningfulContactMatch(startOfToday, endOfToday), userFilter] }
    : buildMeaningfulContactMatch(startOfToday, endOfToday);

  const [aggregationResult] = await LeadModel.aggregate([
    {
      $facet: {
        // 1. Stage Counts
        stageStats: [
          {
            $group: {
              _id: { $ifNull: ["$status", "uncontacted"] },
              count: { $sum: 1 },
            },
          },
        ],

        // 2. Today's Meaningful Contacts Across Workspace
        todayTouchesAll: [
          { $match: buildMeaningfulContactMatch(startOfToday, endOfToday) },
          { $count: "count" },
        ],

        // 3. Yesterday's Meaningful Contacts Across Workspace
        yesterdayTouchesAll: [
          { $match: buildMeaningfulContactMatch(startOfYesterday, endOfYesterday) },
          { $count: "count" },
        ],

        // 4. Moderator-Specific Today Meaningful Contacts
        moderatorTodayTouches: [
          { $match: moderatorMeaningfulMatch },
          { $count: "count" },
        ],

        // 4b. Moderator-Specific Today Dial Attempts
        moderatorAttemptsToday: [
          { $match: moderatorAttemptsMatch },
          { $count: "count" },
        ],

        // 5. Today's Touchpoint Breakdown (all attempts by status)
        todayTouchBreakdown: [
          { $match: moderatorAttemptsMatch },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],

        // 6. Today's Due Follow-Up Calls (Moderator-specific: only leads dealt by / assigned to this moderator)
        todayFollowUps: [
          {
            $match: {
              followUpDate: { $lte: endOfToday, $ne: null },
              status: { $nin: ["converted", "not_interested", "invalid"] },
              ...(userId
                ? {
                    $or: [
                      { "lastContactedBy.userId": userId },
                      { "assignedTo.userId": userId },
                    ],
                  }
                : {}),
            },
          },
          { $sort: { followUpDate: 1 } },
          { $limit: 20 },
        ],

        // 7. Priority Uncontacted Hot Prospects
        hotProspects: [
          {
            $match: {
              status: "uncontacted",
              phone: { $exists: true, $ne: "" },
              $or: [{ website: "" }, { website: null }, { website: { $exists: false } }],
            },
          },
          { $limit: 4 },
        ],

        // 8. Recent Leads
        recentLeads: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
        ],
      },
    },
  ]);

  const raw = aggregationResult || {};

  // Stage Stats
  const stageStats: Record<string, number> = {
    uncontacted: 0,
    called: 0,
    call_later: 0,
    interested: 0,
    converted: 0,
    not_interested: 0,
    invalid: 0,
  };
  (raw.stageStats || []).forEach((item: { _id: string; count: number }) => {
    if (stageStats[item._id] !== undefined) {
      stageStats[item._id] = item.count;
    } else {
      stageStats.uncontacted += item.count;
    }
  });

  const modTargets = getModeratorTargetsForDate(userId, startOfToday, settings);
  const todayTarget = modTargets.dailyContactTarget;
  const todayCount = raw.todayTouchesAll?.[0]?.count ?? 0;
  const yesterdayCount = raw.yesterdayTouchesAll?.[0]?.count ?? 0;
  const moderatorTodayCount = userId
    ? (raw.moderatorTodayTouches?.[0]?.count ?? 0)
    : (raw.moderatorTodayTouches?.[0]?.count ?? todayCount);
  const attemptsToday = userId
    ? (raw.moderatorAttemptsToday?.[0]?.count ?? 0)
    : (raw.moderatorAttemptsToday?.[0]?.count ?? todayCount);
  const remainingToGo = Math.max(0, todayTarget - moderatorTodayCount);
  const progressPercent = Math.min(100, Math.round((moderatorTodayCount / (todayTarget || 1)) * 100));
  const reachRate = attemptsToday > 0 ? Math.round((moderatorTodayCount / attemptsToday) * 100) : 0;

  // Touchpoint Breakdown
  let calledToday = 0;
  let interestedToday = 0;
  let interestedOnlyToday = 0;
  let callLaterToday = 0;
  let convertedToday = 0;
  let notInterestedToday = 0;
  let invalidToday = 0;

  (raw.todayTouchBreakdown || []).forEach((item: { _id: string; count: number }) => {
    if (item._id === "called") calledToday += item.count;
    if (item._id === "interested") interestedOnlyToday += item.count;
    if (item._id === "interested" || item._id === "converted") interestedToday += item.count;
    if (item._id === "converted") convertedToday += item.count;
    if (item._id === "call_later") callLaterToday += item.count;
    if (item._id === "not_interested") notInterestedToday += item.count;
    if (item._id === "invalid") invalidToday += item.count;
  });

  // Enrich Follow-Ups with real-time indicators
  const nowMs = Date.now();
  const todayFollowUps = (raw.todayFollowUps || []).map((lead: any) => {
    const ts = Number(lead.followUpDate);
    const isOverdue = ts < nowMs;
    const isDueNow = Math.abs(ts - nowMs) <= 1000 * 60 * 30; // within 30 min
    const callNotes = lead.notes || [];
    const lastCallNote = callNotes[callNotes.length - 1] || null;

    return {
      lead,
      followUpTs: ts,
      isOverdue,
      isDueNow,
      lastCallNote,
    };
  });

  const totalLeads = Object.values(stageStats).reduce((acc, curr) => acc + curr, 0);

  return {
    dailyTarget: todayTarget,
    kpiStats: {
      dailyTarget: todayTarget,
      dailyCallTarget: modTargets.dailyCallTarget,
      dailyQualifiedTarget: modTargets.dailyQualifiedTarget,
      dailyConversionTarget: modTargets.dailyConversionTarget,
      isCustomTarget: modTargets.isCustom,
      todayCount,
      moderatorTodayCount,
      attemptsToday,
      qualifiedToday: interestedToday,
      convertedToday,
      reachRate,
      yesterdayCount,
      remainingToGo,
      progressPercent,
      isTargetMet: moderatorTodayCount >= todayTarget,
      calledToday,
      interestedToday,
      interestedOnlyToday,
      callLaterToday,
      notInterestedToday,
      invalidToday,
    },
    stageStats: {
      uncontacted: stageStats.uncontacted,
      called: stageStats.called,
      call_later: stageStats.call_later,
      interested: stageStats.interested,
      converted: stageStats.converted,
      not_interested: stageStats.not_interested,
      invalid: stageStats.invalid,
    },
    totalLeads,
    todayFollowUps,
    hotProspects: raw.hotProspects || [],
    recentLeads: raw.recentLeads || [],
  };
};

export const dashboardService = {
  getAdminDashboardData,
  getModeratorDashboardData,
};
