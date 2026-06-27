"use client";

import React, { useState } from "react";
import { Camera } from "lucide-react";
import PageHeader from "@/components/PageHeader";

interface FormData {
  nickname: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  village: string;
  state: string;
  postcode: string;
  street: string;
}

function FieldGroup({
  label,
  id,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label
        htmlFor={id}
        className="font-josefin font-medium text-[15px] text-black leading-none"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[40px] rounded-[5px] border border-[#0c818a] bg-white px-[12px] font-josefin font-semibold text-[16px] text-black outline-none focus:ring-2 focus:ring-[#0c818a]/30 transition-all"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<FormData>({
    nickname: "Carmen",
    firstName: "Nyoman",
    lastName: "Ayu Carmenita",
    phone: "+62 821-3456-7890",
    email: "carmeth2h@email.com",
    city: "Sleman",
    district: "Mlati",
    village: "Sinduadi",
    state: "DI Yogyakarta",
    postcode: "55284",
    street: "Jl. Magelang Km. 6 No. 247, RT 09/RW 33",
  });

  const set = (key: keyof FormData) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="px-[41px] py-[29px] flex flex-col gap-[16px] w-full max-w-[1163px] mx-auto text-black select-none z-10 relative">
      <PageHeader title="Settings" />

      {/* ─── Profile Card ─── */}
      <div className="bg-white rounded-[16px] p-[40px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.08)]">
        <div className="flex gap-[56px] items-start">
          {/* Avatar column */}
          <div className="flex flex-col items-center gap-[12px] shrink-0">
            <div className="relative">
              <div className="size-[156px] rounded-full border-[3px] border-[#0c818a] overflow-hidden bg-white/50">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Avatar"
                  className="size-full object-cover"
                />
              </div>
              {/* Camera edit button */}
              <button
                className="absolute bottom-0 right-0 size-[44px] rounded-full bg-[#0c818a] border-[3px] border-[#0c818a] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                aria-label="Ganti foto"
              >
                <Camera className="size-[18px] text-white" strokeWidth={1.6} />
              </button>
            </div>
            <span className="font-josefin font-semibold text-[30px] text-black leading-none">
              Carmen
            </span>
          </div>

          {/* Form column */}
          <div className="flex flex-col gap-[20px] flex-1 min-w-0">
            {/* Profile tab */}
            <div className="self-start">
              <span
                className="font-josefin font-bold text-[18px] text-white px-[22px] py-[8px] rounded-[5px] leading-none"
                style={{ backgroundColor: "#0c818a" }}
              >
                Profile
              </span>
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-[14px]">
              <FieldGroup
                label="Nickname"
                id="nickname"
                value={form.nickname}
                onChange={set("nickname")}
              />
              <div className="grid grid-cols-2 gap-[14px]">
                <FieldGroup
                  label="First Name"
                  id="firstName"
                  value={form.firstName}
                  onChange={set("firstName")}
                />
                <FieldGroup
                  label="Last Name"
                  id="lastName"
                  value={form.lastName}
                  onChange={set("lastName")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Contact & Address Card ─── */}
      <div className="bg-white rounded-[16px] p-[40px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.08)] flex flex-col gap-[20px]">

        {/* Contact section */}
        <div className="flex flex-col gap-[14px]">
          <div className="self-start">
            <span
              className="font-josefin font-bold text-[18px] text-white px-[22px] py-[8px] rounded-[5px] leading-none"
              style={{ backgroundColor: "#0c818a" }}
            >
              Contact
            </span>
          </div>
          <div className="grid grid-cols-2 gap-[14px]">
            <FieldGroup
              label="Phone Number"
              id="phone"
              value={form.phone}
              onChange={set("phone")}
              type="tel"
            />
            <FieldGroup
              label="Email Address"
              id="email"
              value={form.email}
              onChange={set("email")}
              type="email"
            />
          </div>
        </div>

        {/* Address section */}
        <div className="flex flex-col gap-[14px]">
          <div className="self-start">
            <span
              className="font-josefin font-bold text-[18px] text-white px-[22px] py-[8px] rounded-[5px] leading-none"
              style={{ backgroundColor: "#0c818a" }}
            >
              Address
            </span>
          </div>

          {/* Street + City */}
          <div className="flex gap-[14px]">
            <div className="flex-[2] min-w-0">
              <FieldGroup
                label="Street Address"
                id="street"
                value={form.street}
                onChange={set("street")}
              />
            </div>
            <div className="flex-1 min-w-0">
              <FieldGroup
                label="City"
                id="city"
                value={form.city}
                onChange={set("city")}
              />
            </div>
          </div>

          {/* District + Village + State */}
          <div className="grid grid-cols-3 gap-[14px]">
            <FieldGroup
              label="District"
              id="district"
              value={form.district}
              onChange={set("district")}
            />
            <FieldGroup
              label="Village"
              id="village"
              value={form.village}
              onChange={set("village")}
            />
            <FieldGroup
              label="State"
              id="state"
              value={form.state}
              onChange={set("state")}
            />
          </div>

          {/* Postcode + Save button */}
          <div className="flex items-end justify-between gap-[14px]">
            <div className="w-[280px]">
              <FieldGroup
                label="Postcode"
                id="postcode"
                value={form.postcode}
                onChange={set("postcode")}
              />
            </div>
            <button
              className="font-josefin font-medium text-[18px] text-white rounded-[8px] px-[14px] py-[10px] hover:opacity-80 transition-opacity cursor-pointer shrink-0"
              style={{ backgroundColor: "#0c818a" }}
              onClick={() => alert("Perubahan disimpan!")}
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
