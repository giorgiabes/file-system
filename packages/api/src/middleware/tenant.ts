import { Request, Response, NextFunction } from "express";
import { IMetadataRepository } from "@file-system/core/dist/interfaces/IMetadataRepository";

export function createTenantMiddleware(repository: IMetadataRepository) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      repository.setTenant(req.user.tenantId);
    }
    next();
  };
}
