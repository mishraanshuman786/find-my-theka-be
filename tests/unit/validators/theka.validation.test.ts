import { describe, it, expect } from "vitest";
import { createThekaSchema } from "../../../src/validators/theka.validation";

const validTheka = {
  name: "Sharma Wine Shop",
  contactPhone: "9876543210",
  address: "Main Road, Near Railway Crossing",
  city: "Varanasi",
  state: "Uttar Pradesh",
  pincode: "221001",
  latitude: 25.4358,
  longitude: 82.8534,
  aadhaarNumber: "123456789012",
  gstNumber: "09ABCDE1234F1Z5",
  licenseNumber: "UP-EXC-123456",
   licenseExpiryDate: "2028-12-31",
};

describe("createThekaSchema",()=>{
    it("should accept a valid theka registration payload",()=>{
        const result=createThekaSchema.safeParse(validTheka);

        expect(result.success).toBe(true);
    });

    it("should reject when name is missing",()=>{
        const {name, ...payload}=validTheka;

        const result=createThekaSchema.safeParse(payload);
        expect(result.success).toBe(false);
    });

    it("should reject a name shorter than 2 characters",()=>{
        const result=createThekaSchema.safeParse({...validTheka,name:"A"});
        expect(result.success).toBe(false);
    });

    it("should reject a name longer than 150 characters",()=>{
        const result=createThekaSchema.safeParse({
            ...validTheka,
            name:"A".repeat(151)
        });

        expect(result.success).toBe(false);
    });

    it("should reject an invalid contact phone number",()=>{
        const result=createThekaSchema.safeParse({
            ...validTheka,
            contactPhone:"1234567890"
        });

        expect(result.success).toBe(false);
    });

    it("should reject a contact Phone Number with less than 10 digits",()=>{
        const result=createThekaSchema.safeParse({
            ...validTheka,
            contactPhone:"987654321"
        });

        expect(result.success).toBe(false);
    });

    it("should reject an invalid pincode",()=>{
        const result=createThekaSchema.safeParse({
            ...validTheka,
            pincode:"22100"
        });

        expect(result.success).toBe(false);
    });

    it("should reject an invalid aadhar number",()=>{
        const result=createThekaSchema.safeParse({
            ...validTheka,
            aadhaarNumber:"12345678901"
        });

        expect(result.success).toBe(false);
    });

    it("should reject an aadhar number containing letters",()=>{
        const result=createThekaSchema.safeParse({
            ...validTheka,
            aadhaarNumber:"12345678901A"
        });

        expect(result.success).toBe(false);
    });

    it("should reject an invalid gst number",()=>{
        const result=createThekaSchema.safeParse({
            ...validTheka,
            gstNumber:"INVALID-GST"
        });

        expect(result.success).toBe(false);
    });

     it("should reject an invalid latitude", () => {
    const result = createThekaSchema.safeParse({
      ...validTheka,
      latitude: 91,
    });

    expect(result.success).toBe(false);
  });

  it("should reject an invalid longitude", () => {
    const result = createThekaSchema.safeParse({
      ...validTheka,
      longitude: 181,
    });

    expect(result.success).toBe(false);
  });

  it("should reject latitude below -90", () => {
    const result = createThekaSchema.safeParse({
      ...validTheka,
      latitude: -91,
    });

    expect(result.success).toBe(false);
  });

  it("should reject longitude below -180", () => {
    const result = createThekaSchema.safeParse({
      ...validTheka,
      longitude: -181,
    });

    expect(result.success).toBe(false);
  });

  it("should reject an invalid license number", () => {
    const result = createThekaSchema.safeParse({
      ...validTheka,
      licenseNumber: "AB",
    });

    expect(result.success).toBe(false);
  });

  it("should trim string values", () => {
    const result = createThekaSchema.safeParse({
      ...validTheka,
      name: "  Sharma Wine Shop  ",
      city: "  Varanasi  ",
      gstNumber: "09abcde1234f1z5",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Sharma Wine Shop");
      expect(result.data.city).toBe("Varanasi");
      expect(result.data.gstNumber).toBe("09ABCDE1234F1Z5");
    }
  });

  it("should reject a missing required field", () => {
    const requiredFields = [
      "name",
      "contactPhone",
      "address",
      "city",
      "state",
      "pincode",
      "latitude",
      "longitude",
      "aadhaarNumber",
      "gstNumber",
      "licenseNumber",
    ] as const;

    for (const field of requiredFields) {
      const payload = { ...validTheka };
      delete payload[field];

      const result = createThekaSchema.safeParse(payload);

      expect(result.success).toBe(false);
    }
  });
})
