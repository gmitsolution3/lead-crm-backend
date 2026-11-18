import { Request, Response } from "express";

const healthController = (
  _req: Request,
  res: Response,
) => {
  res.status(200).json({
    success: true,
    message: "Lead Extension Backend API is running!",
  });
};

export default healthController;
