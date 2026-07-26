import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { ensureLocalAuthSession } from "@/lib/auth-token";
import {
  APP_ROLE_OPTIONS,
  COUNTY_OPTIONS,
  INDUSTRY_OPTIONS,
  type AppUserRole,
  useLocalityOptionsForCounty,
} from "@/lib/ro-taxonomies";
import { useProfile } from "@/lib/use-profile";
import { Check, ChevronRight, MapPin, Rocket, Users2 } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

const badges = ["Primii pași", "Explorator", "Orientat"];

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const { profile, saveProfile } = useProfile();
  const initialCounty = profile.judet || profile.counties[0] || COUNTY_OPTIONS[0];
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [selectedCounty, setSelectedCounty] = useState(initialCounty);
  const [selectedCity, setSelectedCity] = useState(profile.city || "");
  const [customIndustries, setCustomIndustries] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    profile.industry ? [profile.industry] : ["IT & Software"],
  );
  const [selectedRole, setSelectedRole] = useState<AppUserRole>(
    profile.role || "antreprenor",
  );
  const [validationError, setValidationError] = useState("");
  const cityOptions = useLocalityOptionsForCounty(selectedCounty);
  const availableIndustries = useMemo(
    () => [...INDUSTRY_OPTIONS, ...customIndustries],
    [customIndustries],
  );
  const completedSteps = [
    Boolean(name.trim() && email.trim()),
    Boolean(selectedCounty && selectedCity),
    selectedIndustries.length > 0,
    Boolean(selectedRole),
  ].filter(Boolean).length;

  const handleCountyChange = (value: string) => {
    setSelectedCounty(value);
  };

  useEffect(() => {
    if (!cityOptions.length) return;
    if (!selectedCity || !cityOptions.includes(selectedCity)) {
      setSelectedCity(cityOptions[0] ?? "");
    }
  }, [cityOptions, selectedCity]);

  const handleToggleIndustry = (industry: string) => {
    setSelectedIndustries((current) => {
      if (current.includes(industry)) {
        return current.filter((item) => item !== industry);
      }
      if (current.length >= 5) {
        return current;
      }
      return [...current, industry];
    });
  };

  const handleAddCustomIndustry = () => {
    const rawValue = window.prompt("Adaugă o industrie relevantă pentru profilul tău.");
    const value = rawValue?.trim();
    if (!value) return;

    setCustomIndustries((current) => {
      if (current.includes(value) || INDUSTRY_OPTIONS.includes(value as (typeof INDUSTRY_OPTIONS)[number])) return current;
      return [...current, value];
    });
    setSelectedIndustries((current) => {
      if (current.includes(value)) return current;
      return current.length >= 5 ? current : [...current, value];
    });
  };

  const handleContinue = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setValidationError("Completează numele pentru a finaliza înrolarea.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setValidationError("Completează o adresă de email validă.");
      return;
    }
    if (!selectedCounty || !selectedCity) {
      setValidationError("Alege județul și localitatea principală.");
      return;
    }
    if (!selectedIndustries.length) {
      setValidationError("Selectează cel puțin o industrie relevantă.");
      return;
    }
    if (!selectedRole) {
      setValidationError("Alege rolul principal în platformă.");
      return;
    }

    ensureLocalAuthSession(trimmedEmail);
    const primaryIndustry = selectedIndustries[0] ?? "";
    saveProfile({
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      judet: selectedCounty,
      city: selectedCity,
      counties: selectedCounty ? [selectedCounty] : [],
      industry: primaryIndustry,
      role: selectedRole,
      avatarUrl: `https://i.pravatar.cc/160?u=${encodeURIComponent(trimmedEmail)}`,
    });
    setValidationError("");
    navigate("/semnale");
  };

  return (
    <PublicLayout>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Bine ai venit la OpportunIQ</h1>
              <p className="mt-2 text-sm text-slate-600">
                Completează câțiva pași simpli pentru a primi semnale și potriviri relevante.
              </p>
            </div>

            <div className="flex items-center gap-4 text-center">
              {["Date cont", "Locație", "Industrii", "Rol"].map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        index < completedSteps
                          ? "bg-[#0b5c66] text-white"
                          : "border border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {index < completedSteps ? <Check size={14} /> : index + 1}
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{step}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <StepCard
              number="1"
              icon={<Users2 size={20} />}
              title="Completează datele contului"
              subtitle="Aceste date devin baza profilului tău și activează sesiunea locală."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <InputField
                  label="Nume complet"
                  value={name}
                  placeholder="Ex: Andrei Popescu"
                  onChange={setName}
                />
                <InputField
                  label="Email"
                  type="email"
                  value={email}
                  placeholder="Ex: andrei@firma.ro"
                  onChange={setEmail}
                />
                <InputField
                  label="Telefon"
                  value={phone}
                  placeholder="Ex: +40 712 345 678"
                  onChange={setPhone}
                />
              </div>
            </StepCard>

            <StepCard
              number="2"
              icon={<MapPin size={20} />}
              title="Alege zona de interes"
              subtitle="Ne ajută să îți arătăm oportunități relevante în zona potrivită."
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[240px_240px_1fr]">
                <SelectBox
                  label="Județ"
                  value={selectedCounty}
                  options={COUNTY_OPTIONS}
                  onChange={handleCountyChange}
                />
                <SelectBox
                  label="Localitate"
                  value={selectedCity}
                  options={cityOptions}
                  onChange={setSelectedCity}
                />
                <div className="hidden rounded-2xl bg-slate-50 xl:block" />
              </div>
            </StepCard>

            <StepCard
              number="3"
              icon={<Rocket size={20} />}
              title="Selectează până la 5 industrii"
              subtitle="Alege domeniile care te interesează cel mai mult."
            >
              <div className="flex flex-wrap gap-2">
                {availableIndustries.map((industry) => {
                  const selected = selectedIndustries.includes(industry);
                  return (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => handleToggleIndustry(industry)}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                        selected
                          ? "border-sky-200 bg-sky-50 text-[#0b5c66]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {industry}
                      {selected && <Check size={14} className="ml-2 inline" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleAddCustomIndustry}
                  className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500"
                >
                  + Adaugă altă industrie
                </button>
              </div>
            </StepCard>

            <StepCard
              number="4"
              icon={<Users2 size={20} />}
              title="Care este rolul tău principal?"
              subtitle="Ne ajută să personalizăm experiența în platformă."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <RoleCard
                  title={APP_ROLE_OPTIONS[0].label}
                  subtitle="Primești semnale și potriviri ca antreprenor."
                  selected={selectedRole === APP_ROLE_OPTIONS[0].value}
                  onClick={() => setSelectedRole(APP_ROLE_OPTIONS[0].value)}
                />
                <RoleCard
                  title={APP_ROLE_OPTIONS[1].label}
                  subtitle="Intri în produs ca actor terț pentru validare și conectare."
                  selected={selectedRole === APP_ROLE_OPTIONS[1].value}
                  onClick={() => setSelectedRole(APP_ROLE_OPTIONS[1].value)}
                />
              </div>
            </StepCard>
          </div>

          <div className="mt-6 flex justify-end">
            {validationError ? (
              <p className="mr-auto max-w-md text-sm font-medium text-rose-600">{validationError}</p>
            ) : null}
            <Button onClick={handleContinue} className="rounded-xl bg-[#0b5c66] px-8 text-white hover:bg-[#084b53]">
              Continuă <ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        </section>

        <aside className="space-y-4">
          <Panel title="Cum funcționează OpportunIQ">
            <ul className="space-y-4 text-sm text-slate-600">
              <li>
                <span className="font-semibold text-slate-800">Primești semnale relevante</span>
                <div>Detectăm idei și oportunități din surse reale.</div>
              </li>
              <li>
                <span className="font-semibold text-slate-800">Filtrezi și salvezi ce te interesează</span>
                <div>Folosește filtre și liste pentru a organiza ce contează pentru tine.</div>
              </li>
              <li>
                <span className="font-semibold text-slate-800">Acționezi și creezi valoare</span>
                <div>Colaborezi, conectează-te și transformă ideile în proiecte de impact.</div>
              </li>
            </ul>
          </Panel>

          <Panel title="Progresul tău">
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-8 border-slate-100 border-t-[#0b5c66] text-xl font-bold text-slate-900">
                {Math.round((completedSteps / 4) * 100)}%
              </div>
              <div className="text-sm text-slate-600">
                <div className="font-semibold text-slate-800">Profil aproape complet!</div>
                <div className="mt-2 space-y-1">
                  <div>Date cont</div>
                  <div>Locație</div>
                  <div>Industrii</div>
                  <div>Rol</div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Badge-uri de început">
            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge) => (
                <div key={badge} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border bg-white">
                    <Rocket size={18} className="text-[#0b5c66]" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700">{badge}</div>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </PublicLayout>
  );
}

function StepCard({
  number,
  icon,
  title,
  subtitle,
  children,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-[#0b5c66]">
          {icon}
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900">
            {number}. {title}
          </div>
          <div className="text-sm text-slate-500">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400"
      />
    </div>
  );
}

function SelectBox({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function RoleCard({
  title,
  subtitle,
  selected = false,
  onClick,
}: {
  title: string;
  subtitle: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition-colors ${
        selected ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-bold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
        </div>
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
            selected ? "border-[#0b5c66] bg-[#0b5c66] text-white" : "border-slate-300"
          }`}
        >
          {selected && <Check size={14} />}
        </div>
      </div>
    </button>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
