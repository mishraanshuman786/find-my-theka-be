import {
  thekaRepository,
  ThekaRepository,
} from "../repositories/theka.repository";

import { CreateThekaInput } from "../validators/theka.validation";

export class ThekaService {
  constructor(
    private readonly thekaRepository: ThekaRepository,
  ) {}

  async createTheka(
    userId: number,
    data: CreateThekaInput,
  ) {
    return this.thekaRepository.create({
      ownerUserId: userId,

      name: data.name,
      contactPhone: data.contactPhone,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,

      latitude: data.latitude.toString(),
      longitude: data.longitude.toString(),

      aadhaarNumber: data.aadhaarNumber,
      gstNumber: data.gstNumber,
      licenseNumber: data.licenseNumber,
      licenseExpiryDate: data.licenseExpiryDate,
      status: "PENDING",
    });


  }

  async getMyThekas(userId:number){
    return this.thekaRepository.findByOwnerUserId(userId);
  }

  async getThekaById(thekaId:number,userId:number){
    return this.thekaRepository.findByIdAndOwnerUserId(thekaId, userId);
  }
}

export const thekaService = new ThekaService(
  thekaRepository,
);