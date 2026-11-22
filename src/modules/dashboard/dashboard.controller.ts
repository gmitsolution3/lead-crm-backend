import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { dashboardService } from "./dashboard.service";
import { TAdminTimeframe } from "./dashboard.types";

const getAdminDashboard = catchAsync(async (req: Request, res: Response) => {
  const timeframe = (req.query.timeframe as TAdminTimeframe) || "7d";
  const result = await dashboardService.getAdminDashboardData(timeframe);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin dashboard analytics retrieved successfully",
    data: result,
  });
});

const getModeratorDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const result = await dashboardService.getModeratorDashboardData(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Moderator operations dashboard retrieved successfully",
    data: result,
  });
});

export const dashboardController = {
  getAdminDashboard,
  getModeratorDashboard,
};
