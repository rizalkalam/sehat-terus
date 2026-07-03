export interface User {
  email: string;
  name: string;
  displayName: string;
  avatarSrc?: string;
}

export const AUTH_COOKIE = "st_auth";
export const USER_COOKIE = "st_user";

export const STATIC_USERS: (User & { password: string })[] = [
  {
    email: "carmen@sehatterus.id",
    password: "sehat123",
    name: "Carmen",
    displayName: "Carmenita",
    avatarSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    email: "admin@sehatterus.id",
    password: "admin123",
    name: "Admin",
    displayName: "Administrator",
    avatarSrc:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
];
