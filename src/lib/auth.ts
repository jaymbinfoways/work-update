import User, { IUser } from "@/models/User";
import bcrypt from "bcryptjs";
import connectToDatabase from "./mongodb";

export async function getOrCreateDefaultUser(): Promise<IUser> {
  await connectToDatabase();
  
  const email = process.env.DEFAULT_USER_EMAIL || "admin@workupdate.com";
  const name = process.env.DEFAULT_USER_NAME || "Jay Infoways";

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.findOne();
  }

  if (!user) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    user = await User.create({
      name,
      email,
      passwordHash,
    });
  }
  return user;
}
