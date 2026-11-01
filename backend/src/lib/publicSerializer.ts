export interface ViewerContext {
  isOwner: boolean;
  viewerUserId?: string;
  isClientWithProposal?: boolean;
}

/**
 * Shared serializer for public profile preview and client-facing public profile.
 * - Enforces privacy: omits email, credentials, storage keys, filesystem paths, fabricated stats.
 * - Omit empty/null fields.
 * - Handles hidden profiles: returns null if hidden and viewer is not the owner (caller sends 404).
 * - Handles resume visibility: includes public resume URL only if visibility is PUBLIC.
 * - Phase 8: respects user.visibility, user.showRate, and user.showPortfolio privacy flags.
 */
export function toPublicProfile(profile: any, context: ViewerContext = { isOwner: false }) {
  if (!profile) return null;

  // Privacy flag checks from User settings (Phase 8)
  const userVisibility = profile.user?.visibility || "PUBLIC";
  const showRate = profile.user?.showRate !== false;
  const showPortfolio = profile.user?.showPortfolio !== false;

  // If searchVisibility is HIDDEN or user visibility is PRIVATE and viewer is not the profile owner, reject
  if ((profile.searchVisibility === "HIDDEN" || userVisibility === "PRIVATE") && !context.isOwner) {
    return null;
  }

  const result: Record<string, any> = {};

  // Core identification
  if (profile.id) result.id = profile.id;
  if (profile.user?.name) result.name = profile.user.name;
  if (profile.professionalTitle) result.professionalTitle = profile.professionalTitle;
  if (profile.headline) result.headline = profile.headline;
  if (profile.locationText) result.location = profile.locationText;
  if (profile.countryCode) result.countryCode = profile.countryCode;
  if (profile.timezone) result.timezone = profile.timezone;
  if (profile.bio) result.bio = profile.bio;

  // Public File URLs (never internal keys)
  if (profile.photoFileId) {
    result.photoUrl = `/api/files/${profile.photoFileId}`;
  }
  if (profile.coverFileId) {
    result.coverUrl = `/api/files/${profile.coverFileId}`;
  }

  // Professional details
  if (profile.specialization) result.specialization = profile.specialization;
  if (profile.servicesOffered && profile.servicesOffered.length > 0) {
    result.servicesOffered = profile.servicesOffered;
  }
  if (profile.preferredProjectTypes && profile.preferredProjectTypes.length > 0) {
    result.preferredProjectTypes = profile.preferredProjectTypes;
  }
  if (profile.tools && profile.tools.length > 0) {
    result.tools = profile.tools;
  }
  if (profile.experienceLevel) result.experienceLevel = profile.experienceLevel;

  // Rates in integer minor units (omitted if user set showRate: false and viewer not owner)
  if ((showRate || context.isOwner) && profile.rateHourlyMinor !== null && profile.rateHourlyMinor !== undefined) {
    result.hourlyRate = {
      amountMinor: profile.rateHourlyMinor,
      currency: profile.rateCurrency || "USD",
      formatted: `$${(profile.rateHourlyMinor / 100).toFixed(2)}/hr`,
    };
  }

  // Availability
  const availability: Record<string, any> = {};
  if (profile.availabilityStatus) availability.status = profile.availabilityStatus;
  if (profile.weeklyCapacityHours !== null && profile.weeklyCapacityHours !== undefined) {
    availability.weeklyCapacityHours = profile.weeklyCapacityHours;
  }
  if (profile.preferredEngagement) availability.preferredEngagement = profile.preferredEngagement;
  if (profile.workArrangement) availability.workArrangement = profile.workArrangement;
  if (Object.keys(availability).length > 0) {
    result.availability = availability;
  }

  // Skills
  const rawSkills = profile.freelancerSkills || [];
  if (rawSkills.length > 0) {
    result.skills = rawSkills.map((s: any) => {
      const skillObj: Record<string, any> = { name: s.skillName };
      if (s.proficiency) skillObj.proficiency = s.proficiency;
      return skillObj;
    });
  }

  // Portfolio (omitted if user set showPortfolio: false and viewer not owner)
  const rawPortfolio = (showPortfolio || context.isOwner) ? (profile.portfolioProjects || []) : [];
  if (rawPortfolio.length > 0) {
    result.portfolio = rawPortfolio.map((p: any) => {
      const portObj: Record<string, any> = {
        id: p.id,
        title: p.title,
        description: p.description,
        role: p.role,
      };
      if (p.tools && p.tools.length > 0) portObj.tools = p.tools;
      if (p.projectUrl) portObj.projectUrl = p.projectUrl;
      if (p.repoUrl) portObj.repoUrl = p.repoUrl;
      if (p.startMonth) portObj.startMonth = p.startMonth;
      if (p.endMonth) portObj.endMonth = p.endMonth;
      if (p.coverFileId) portObj.coverUrl = `/api/files/${p.coverFileId}`;
      return portObj;
    });
  }

  // Work Experience
  const rawExp = profile.workExperiences || [];
  if (rawExp.length > 0) {
    result.experience = rawExp.map((e: any) => {
      const expObj: Record<string, any> = {
        id: e.id,
        company: e.company,
        role: e.role,
        startMonth: e.startMonth,
        isCurrent: e.isCurrent,
      };
      if (e.location) expObj.location = e.location;
      if (!e.isCurrent && e.endMonth) expObj.endMonth = e.endMonth;
      if (e.description) expObj.description = e.description;
      if (e.responsibilities && e.responsibilities.length > 0) {
        expObj.responsibilities = e.responsibilities;
      }
      if (e.achievements && e.achievements.length > 0) {
        expObj.achievements = e.achievements;
      }
      return expObj;
    });
  }

  // Education
  const rawEdu = profile.educationEntries || [];
  if (rawEdu.length > 0) {
    result.education = rawEdu.map((ed: any) => {
      const eduObj: Record<string, any> = {
        id: ed.id,
        institution: ed.institution,
        degree: ed.degree,
        startYear: ed.startYear,
      };
      if (ed.fieldOfStudy) eduObj.fieldOfStudy = ed.fieldOfStudy;
      if (ed.graduationYear) eduObj.graduationYear = ed.graduationYear;
      if (ed.description) eduObj.description = ed.description;
      return eduObj;
    });
  }

  // Certifications
  const rawCerts = profile.certifications || [];
  if (rawCerts.length > 0) {
    result.certifications = rawCerts.map((c: any) => {
      const certObj: Record<string, any> = {
        id: c.id,
        name: c.name,
        issuer: c.issuer,
        issuedMonth: c.issuedMonth,
      };
      if (c.expiresMonth) certObj.expiresMonth = c.expiresMonth;
      if (c.credentialUrl) certObj.credentialUrl = c.credentialUrl;
      return certObj;
    });
  }

  // Resume Visibility Rules:
  // - If active resume is PUBLIC: include public resume download URL
  // - If active resume is PROPOSAL_CLIENTS: include only if context.isClientWithProposal or owner
  // - If PRIVATE: exclude for public viewers
  const activeResume = profile.user?.resumeFiles?.[0];
  if (activeResume) {
    if (activeResume.visibility === "PUBLIC") {
      result.resumeUrl = `/api/public/freelancers/${profile.userId}/resume`;
    } else if (
      activeResume.visibility === "PROPOSAL_CLIENTS" &&
      (context.isClientWithProposal || context.isOwner)
    ) {
      result.resumeUrl = `/api/public/freelancers/${profile.userId}/resume`;
    }
  }

  // Owner Preview Context
  if (context.isOwner) {
    result.searchVisibility = profile.searchVisibility;
    result.isPreviewOnly = true;
  }

  return result;
}
