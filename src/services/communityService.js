import { supabase } from "./supabaseClient";
import { isValidHttpsUrl, validateTicketDraft } from "../features/community/communityValidation";

const TICKET_COLUMNS =
  "id, request_type, title, description, category, steps_to_reproduce, expected_behavior, actual_behavior, affected_page, related_url, allow_public_credit, public_display_name, status, is_public, resolution_note, created_at, updated_at";
const PUBLIC_TICKET_COLUMNS =
  "id, request_type, title, description, category, public_display_name, status, resolution_note, created_at";

function throwOnError(error) {
  if (error) throw error;
}

export async function getCommunityStats() {
  const { data, error } = await supabase.rpc("get_community_stats");
  throwOnError(error);
  if (!Array.isArray(data) || data.length !== 1) {
    throw new Error("Community statistics returned an invalid response.");
  }

  return {
    developers: Number(data[0].developer_count),
    publicDevelopers: Number(data[0].public_developer_count),
    requests: Number(data[0].request_count),
    featureRequests: Number(data[0].feature_request_count),
    problemReports: Number(data[0].problem_report_count),
    underReview: Number(data[0].under_review_count),
    resolvedProblems: Number(data[0].resolved_problem_count),
    contributors: Number(data[0].contributor_count),
  };
}

export async function listPublicTickets({ requestType = "all", status = "all", page = 1, pageSize = 9 } = {}) {
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    throw new Error("Invalid community board pagination.");
  }

  let query = supabase
    .from("community_tickets")
    .select(PUBLIC_TICKET_COLUMNS, { count: "exact" })
    .eq("is_public", true)
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (requestType !== "all") query = query.eq("request_type", requestType);
  if (status !== "all") query = query.eq("status", status);

  const { data, error, count } = await query;
  throwOnError(error);
  return { data: data || [], count: count || 0 };
}

export async function listMyTickets() {
  const { data, error } = await supabase.rpc("list_my_community_tickets");
  throwOnError(error);
  return data || [];
}

export async function submitCommunityTicket(draft) {
  const errors = validateTicketDraft(draft);
  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors)[0]);
  }

  const { data, error } = await supabase
    .from("community_tickets")
    .insert({
      request_type: draft.requestType,
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      steps_to_reproduce: draft.requestType === "bug" ? draft.stepsToReproduce.trim() : null,
      expected_behavior: draft.requestType === "bug" ? draft.expectedBehavior.trim() : null,
      actual_behavior: draft.requestType === "bug" ? draft.actualBehavior.trim() : null,
      affected_page: draft.affectedPage?.trim() || null,
      related_url: draft.relatedUrl?.trim() || null,
      allow_public_credit: Boolean(draft.allowPublicCredit),
      public_display_name: draft.allowPublicCredit ? draft.publicDisplayName.trim() : null,
    })
    .select("id, title, status, created_at")
    .single();
  throwOnError(error);
  return data;
}

export async function listAdminTickets({ status = "all" } = {}) {
  let query = supabase
    .from("community_tickets")
    .select(TICKET_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  throwOnError(error);
  return data || [];
}

export async function reviewCommunityTicket({ id, status, isPublic, resolutionNote }) {
  const { data, error } = await supabase.rpc("review_community_ticket", {
    p_ticket_id: id,
    p_status: status,
    p_is_public: Boolean(isPublic),
    p_resolution_note: resolutionNote?.trim() || null,
  });
  throwOnError(error);
  return data;
}

export async function listPublicAttributions() {
  const { data, error } = await supabase
    .from("community_attributions")
    .select("id, display_name, contribution_type, summary, evidence_url, created_at")
    .eq("is_approved", true)
    .eq("consent_confirmed", true)
    .order("created_at", { ascending: false })
    .limit(12);
  throwOnError(error);
  return data || [];
}

export async function listAdminAttributions() {
  const { data, error } = await supabase
    .from("community_attributions")
    .select("id, display_name, contribution_type, summary, evidence_url, source_ticket_id, consent_confirmed, is_approved, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(100);
  throwOnError(error);
  return data || [];
}

export async function saveAttribution({ id, ...attribution }) {
  const displayName = String(attribution.display_name || "").trim();
  const summary = String(attribution.summary || "").trim();
  const evidenceUrl = String(attribution.evidence_url || "").trim();
  if (!displayName || displayName.length > 100) {
    throw new Error("Contributor name must be 1–100 characters.");
  }
  if (!summary || summary.length > 1200) {
    throw new Error("Contribution summary must be 1–1,200 characters.");
  }
  if (!isValidHttpsUrl(evidenceUrl)) {
    throw new Error("Evidence links must use HTTPS.");
  }
  if (attribution.is_approved && !attribution.consent_confirmed) {
    throw new Error("Confirm contributor permission before publishing recognition.");
  }
  if (![
    "Verified bug report",
    "Implemented feature idea",
    "Merged pull request",
    "Resource contribution",
    "Community review",
    "Other",
  ].includes(attribution.contribution_type)) {
    throw new Error("Select a valid contribution type.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  throwOnError(authError);
  if (!authData.user) throw new Error("Sign in as an administrator to manage recognition.");
  const payload = {
    display_name: displayName,
    contribution_type: attribution.contribution_type,
    summary,
    evidence_url: evidenceUrl,
    consent_confirmed: Boolean(attribution.consent_confirmed),
    source_ticket_id: attribution.source_ticket_id || null,
    reviewed_by: authData.user.id,
    is_approved: Boolean(attribution.is_approved && attribution.consent_confirmed),
  };
  const query = id
    ? supabase.from("community_attributions").update(payload).eq("id", id)
    : supabase.from("community_attributions").insert(payload);
  const { data, error } = await query.select("*").single();
  throwOnError(error);
  return data;
}

export async function deleteAttribution(id) {
  const { error } = await supabase.from("community_attributions").delete().eq("id", id);
  throwOnError(error);
}

export async function submitDeveloperApplication(draft) {
  const name = String(draft.displayName || "").trim();
  const skills = String(draft.skills || "").trim();
  const motivation = String(draft.motivation || "").trim();
  const experience = String(draft.experience || "").trim();
  if (name.length < 1 || name.length > 100) throw new Error("Name must be 1–100 characters.");
  if (skills.length < 1 || skills.length > 1500) throw new Error("Skills must be 1–1,500 characters.");
  if (motivation.length < 10 || motivation.length > 3000) throw new Error("Motivation must be 10–3,000 characters.");
  if (experience.length > 1500) throw new Error("Experience must be no more than 1,500 characters.");
  if (draft.githubUrl && !isValidHttpsUrl(draft.githubUrl, "github.com")) {
    throw new Error("Enter a valid https://github.com profile link.");
  }
  if (draft.portfolioUrl && !isValidHttpsUrl(draft.portfolioUrl)) {
    throw new Error("Portfolio links must use HTTPS.");
  }
  const { data, error } = await supabase
    .from("developer_applications")
    .insert({
      display_name: name,
      skills,
      experience: experience || null,
      github_url: draft.githubUrl?.trim() || null,
      portfolio_url: draft.portfolioUrl?.trim() || null,
      motivation,
    })
    .select("id, status, created_at")
    .single();
  if (error?.code === "23505") {
    throw new Error("You already have an application under review. Open your developer workspace to check its status.");
  }
  throwOnError(error);
  return data;
}

export async function withdrawDeveloperApplication(applicationId) {
  const { data, error } = await supabase.rpc("withdraw_developer_application", {
    p_application_id: applicationId,
  });
  throwOnError(error);
  return data;
}

export async function getDeveloperWorkspace(userId) {
  if (!userId) throw new Error("Sign in to open the developer workspace.");
  const [applicationsResult, profileResult, receivedResult, sentResult] = await Promise.all([
    supabase.from("developer_applications").select("id, user_id, display_name, skills, experience, github_url, portfolio_url, motivation, status, reviewer_notes, created_at, updated_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("developer_profiles").select("user_id, display_name, bio, skills, github_url, portfolio_url, is_public, is_approved, created_at, updated_at").eq("user_id", userId).maybeSingle(),
    supabase.from("hire_proposals").select("*").eq("developer_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("hire_proposals").select("*").eq("sender_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);
  for (const result of [applicationsResult, profileResult, receivedResult, sentResult]) {
    throwOnError(result.error);
  }
  return {
    applications: applicationsResult.data || [],
    profile: profileResult.data,
    receivedProposals: receivedResult.data || [],
    sentProposals: sentResult.data || [],
  };
}

export async function saveDeveloperProfile(userId, draft) {
  if (!userId) throw new Error("Sign in to manage your developer profile.");
  const displayName = String(draft.displayName || "").trim();
  if (!displayName || displayName.length > 100) throw new Error("Profile name must be 1–100 characters.");
  const bio = String(draft.bio || "").trim();
  const skills = String(draft.skills || "").trim();
  if (bio.length > 1600) throw new Error("Profile bio must be no more than 1,600 characters.");
  if (skills.length > 1200) throw new Error("Profile skills must be no more than 1,200 characters.");
  if (draft.githubUrl && !isValidHttpsUrl(draft.githubUrl, "github.com")) {
    throw new Error("Enter a valid https://github.com profile link.");
  }
  if (draft.portfolioUrl && !isValidHttpsUrl(draft.portfolioUrl)) {
    throw new Error("Portfolio links must use HTTPS.");
  }

  const payload = {
    user_id: userId,
    display_name: displayName,
    bio,
    skills,
    github_url: draft.githubUrl?.trim() || null,
    portfolio_url: draft.portfolioUrl?.trim() || null,
    is_public: Boolean(draft.isPublic),
  };
  const { data: existingProfile, error: lookupError } = await supabase
    .from("developer_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  throwOnError(lookupError);

  const query = existingProfile
    ? supabase.from("developer_profiles").update({
        display_name: payload.display_name,
        bio: payload.bio,
        skills: payload.skills,
        github_url: payload.github_url,
        portfolio_url: payload.portfolio_url,
        is_public: payload.is_public,
      }).eq("user_id", userId)
    : supabase.from("developer_profiles").insert(payload);
  const { data, error } = await query.select("*").single();
  throwOnError(error);
  return data;
}

export async function submitHireProposal(developerId, draft) {
  const projectDescription = String(draft.projectDescription || "").trim();
  const deliverables = String(draft.deliverables || "").trim();
  const desiredSkills = String(draft.desiredSkills || "").trim();
  const timeline = String(draft.timeline || "").trim();
  const budgetRange = String(draft.budgetRange || "").trim();
  const contactEmail = String(draft.contactEmail || "").trim();
  if (projectDescription.length < 20 || projectDescription.length > 4000) {
    throw new Error("Project description must be 20–4,000 characters.");
  }
  if (deliverables.length < 5 || deliverables.length > 2000) {
    throw new Error("Deliverables must be 5–2,000 characters.");
  }
  if (desiredSkills.length > 1200) throw new Error("Desired skills must be no more than 1,200 characters.");
  if (timeline.length > 300) throw new Error("Timeline must be no more than 300 characters.");
  if (budgetRange.length > 300) throw new Error("Budget range must be no more than 300 characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || contactEmail.length > 254) {
    throw new Error("Enter a valid contact email. It is shared only with the recipient developer.");
  }
  const { data, error } = await supabase
    .from("hire_proposals")
    .insert({
      developer_id: developerId,
      project_description: projectDescription,
      deliverables,
      desired_skills: desiredSkills || null,
      timeline: timeline || null,
      budget_range: budgetRange || null,
      contact_email: contactEmail,
    })
    .select("id, status, created_at")
    .single();
  throwOnError(error);
  return data;
}

export async function respondToHireProposal(id, status) {
  if (!["accepted", "declined", "withdrawn"].includes(status)) {
    throw new Error("Invalid proposal response.");
  }
  const { data, error } = await supabase
    .from("hire_proposals")
    .update({ status })
    .eq("id", id)
    .eq("status", "sent")
    .select("id, status")
    .single();
  throwOnError(error);
  return data;
}

export async function listAdminDeveloperApplications() {
  const { data, error } = await supabase
    .from("developer_applications")
    .select("id, user_id, display_name, skills, experience, github_url, portfolio_url, motivation, status, reviewer_notes, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(100);
  throwOnError(error);
  return data || [];
}

export async function reviewDeveloperApplication(id, status, notes) {
  const { data, error } = await supabase.rpc("review_developer_application", {
    p_application_id: id,
    p_status: status,
    p_reviewer_notes: notes?.trim() || null,
  });
  throwOnError(error);
  return data;
}

export async function listAdminDeveloperProfiles() {
  const { data, error } = await supabase
    .from("developer_profiles")
    .select("user_id, display_name, bio, skills, github_url, portfolio_url, is_public, is_approved, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(100);
  throwOnError(error);
  return data || [];
}

export async function reviewDeveloperProfile(userId, isApproved) {
  const { data, error } = await supabase.rpc("review_developer_profile", {
    p_user_id: userId,
    p_is_approved: Boolean(isApproved),
  });
  throwOnError(error);
  return data;
}

export async function listPublicDeveloperProfiles() {
  const { data, error } = await supabase
    .from("developer_profiles")
    .select("user_id, display_name, bio, skills, github_url, portfolio_url")
    .eq("is_public", true)
    .eq("is_approved", true)
    .order("display_name", { ascending: true })
    .limit(50);
  throwOnError(error);
  return data || [];
}
