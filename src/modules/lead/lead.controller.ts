import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { leadService } from "./lead.service";

const getSearchGroups = catchAsync(async (req: Request, res: Response) => {
  const result = await leadService.getSearchGroups(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Search groups retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getLeads = catchAsync(async (req: Request, res: Response) => {
  const result = await leadService.getLeads(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leads retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const saveLead = catchAsync(async (req: Request, res: Response) => {
  const result = await leadService.saveLead(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lead processed successfully",
    data: result,
  });
});

const updateLeadRemark = catchAsync(async (req: Request, res: Response) => {
  const leadId = req.params.leadId as string;
  const { remark, groupId } = req.body;
  const result = await leadService.updateLeadRemark(leadId, remark, groupId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lead remark updated successfully",
    data: result,
  });
});

const getKnownLeadsForQuery = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query.query as string | undefined;
    const result = await leadService.getKnownLeadsForQuery(query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Known leads retrieved successfully",
      data: result,
    });
  },
);

const deleteLead = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const leadId = req.params.leadId as string;
  const result = await leadService.deleteLead(groupId, leadId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lead deleted successfully",
    data: result,
  });
});

const deleteSearchGroup = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const result = await leadService.deleteSearchGroup(groupId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Search group deleted successfully",
    data: result,
  });
});

const clearAll = catchAsync(async (_req: Request, res: Response) => {
  await leadService.clearAll();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All leads and groups cleared successfully",
    data: null,
  });
});

const importLeads = catchAsync(async (req: Request, res: Response) => {
  const { leads, groupName, groupId } = req.body;
  const result = await leadService.importLeads(leads, groupName, groupId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leads imported successfully",
    data: result,
  });
});

export const leadController = {
  getSearchGroups,
  getLeads,
  saveLead,
  updateLeadRemark,
  getKnownLeadsForQuery,
  deleteLead,
  deleteSearchGroup,
  clearAll,
  importLeads,
};
