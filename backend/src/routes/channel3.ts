import { Router, Request, Response } from "express";
import { z } from "zod";
import { channel3Service } from "../services/channel3Service.js";

const router = Router();

const searchSchema = z.object({
  query: z.string().min(1, "Search query must not be empty"),
  category: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().min(1).max(50)),
});

/**
 * GET /api/channel3/products
 * Universal product discovery & catalog reference search powered by Channel 3
 */
router.get("/products", async (req: Request, res: Response) => {
  try {
    const parseResult = searchSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid Channel 3 search parameters",
          details: parseResult.error.errors,
        },
      });
    }

    const { query, category, limit } = parseResult.data;
    const result = await channel3Service.searchProducts({ query, category, limit });

    return res.json({
      success: true,
      count: result.count,
      provider: result.provider,
      products: result.products,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Channel 3 lookup error";
    return res.status(500).json({
      error: {
        code: "CHANNEL3_ERROR",
        message,
        details: null,
      },
    });
  }
});

export default router;

