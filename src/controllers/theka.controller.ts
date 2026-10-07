import { Request, Response } from "express";
import { thekaService } from "../services/theka.service";
import { createThekaSchema } from "../validators/theka.validation";

export class ThekaController {
  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized!",
        });
      }

      const validationResult = createThekaSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid Theka Registration Data!",
          error: validationResult.error.flatten().fieldErrors,
        });
      }

      const theka = await thekaService.createTheka(
        req.user.userId,
        validationResult.data,
      );

      return res.status(201).json({
        success: true,
        message: "Theka registration submitted successfully",
        data: theka,
      });
    } catch (error) {
      console.error("Theka Registration Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error!",
      });
    }
  }

  async getMyThekas(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized!",
        });
      }

      const thekas = await thekaService.getMyThekas(req.user.userId);

      return res.status(200).json({
        success: true,
        data: thekas,
      });
    } catch (error) {
      console.error("Get Thekas Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error!",
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized!",
        });
      }

      const thekaId = Number(req.params.id);

      if (!Number.isInteger(thekaId) || thekaId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid theka ID",
        });
      }

      const theka = await thekaService.getThekaById(thekaId, req.user.userId);

      if (!theka) {
        return res.status(404).json({
          success: false,
          message: "Theka not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: theka,
      });
    } catch (error) {
      console.error("Get Theka Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error!",
      });
    }
  }
}

export const thekaController = new ThekaController();
