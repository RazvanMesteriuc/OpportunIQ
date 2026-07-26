export type FluxPrimaryZone = "request" | "change" | "qualification";

export type CompanyArticleType =
  | "colaborare"
  | "anunt"
  | "oferta"
  | "stire"
  | "studiu-caz";

export type LocalPostType =
  | "opportunity"
  | "question"
  | "supplier_request"
  | "collaboration";

export type FluxContentInput =
  | "company_article"
  | "local_post"
  | "ai_signal";

export type FluxContentRouting =
  | {
      input: "company_article";
      semanticType: "company_request";
      entersFlux: true;
      defaultZone: "request";
      canBecomeQualifiedSignal: false;
    }
  | {
      input: "company_article";
      semanticType: "company_context";
      entersFlux: false;
      defaultZone: null;
      canBecomeQualifiedSignal: false;
    }
  | {
      input: "local_post";
      semanticType: "manual_request";
      entersFlux: true;
      defaultZone: "request";
      canBecomeQualifiedSignal: false;
    }
  | {
      input: "local_post";
      semanticType: "manual_signal";
      entersFlux: true;
      defaultZone: "change";
      canBecomeQualifiedSignal: true;
    };

function normalizeType(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeCompanyArticleType(value?: string | null): CompanyArticleType | null {
  const normalized = normalizeType(value);
  if (
    normalized === "colaborare"
    || normalized === "anunt"
    || normalized === "oferta"
    || normalized === "stire"
    || normalized === "studiu-caz"
  ) {
    return normalized;
  }
  return null;
}

export function normalizeLocalPostType(value?: string | null): LocalPostType | null {
  const normalized = normalizeType(value);
  if (
    normalized === "opportunity"
    || normalized === "question"
    || normalized === "supplier_request"
    || normalized === "collaboration"
  ) {
    return normalized;
  }
  return null;
}

export function classifyCompanyArticleForFlux(value?: string | null): FluxContentRouting {
  const articleType = normalizeCompanyArticleType(value);
  if (articleType === "colaborare") {
    return {
      input: "company_article",
      semanticType: "company_request",
      entersFlux: true,
      defaultZone: "request",
      canBecomeQualifiedSignal: false,
    };
  }

  return {
    input: "company_article",
    semanticType: "company_context",
    entersFlux: false,
    defaultZone: null,
    canBecomeQualifiedSignal: false,
  };
}

export function classifyLocalPostForFlux(value?: string | null): FluxContentRouting {
  const postType = normalizeLocalPostType(value);
  if (postType === "supplier_request" || postType === "collaboration") {
    return {
      input: "local_post",
      semanticType: "manual_request",
      entersFlux: true,
      defaultZone: "request",
      canBecomeQualifiedSignal: false,
    };
  }

  return {
    input: "local_post",
    semanticType: "manual_signal",
    entersFlux: true,
    defaultZone: "change",
    canBecomeQualifiedSignal: true,
  };
}
