/**
 * Storage Service Abstraction
 * This allows us to swap storage providers (Local, S3, Google Cloud) 
 * without changing the business logic.
 */
export class StorageService {
  async uploadFile(file, folder) {
    throw new Error('Method not implemented');
  }

  async deleteFile(fileKey) {
    throw new Error('Method not implemented');
  }

  async getSignedUrl(fileKey) {
    throw new Error('Method not implemented');
  }
}
