import User, { IUser } from "@/models/User";
import bcrypt from "bcryptjs";
import connectToDatabase from "./mongodb";

export async function getOrCreateDefaultUser(): Promise<IUser> {
  await connectToDatabase();
  
  let user = await User.findOne({ email: "admin@tracker.local" });
  if (!user) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    user = await User.create({
      name: "Lead Developer",
      email: "admin@tracker.local",
      passwordHash,
    });
  }
  return user;
}
