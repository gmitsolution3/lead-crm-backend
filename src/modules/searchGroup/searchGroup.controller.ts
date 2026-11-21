import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { searchGroupService } from "./searchGroup.service";

const getSearchGroups = catchAsync(async (req: Request, res: Response) => {
  const result = await searchGroupService.getSearchGroups(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Search groups retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSearchGroupById = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const result = await searchGroupService.getSearchGroupById(groupId);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Search group not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Search group retrieved successfully",
    data: result,
  });
});

const deleteSearchGroup = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const result = await searchGroupService.deleteSearchGroup(groupId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Search group deleted successfully",
    data: result,
  });
});

export const searchGroupController = {
  getSearchGroups,
  getSearchGroupById,
  deleteSearchGroup,
};
