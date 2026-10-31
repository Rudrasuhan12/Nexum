export interface ProfileForCompleteness {
  photoFileId?: string | null;
  professionalTitle?: string | null;
  headline?: string | null;
  bio?: string | null;
  locationText?: string | null;
  availabilityStatus?: string | null;
  freelancerSkills?: Array<{ id: string }> | null;
  skills?: string[] | null;
  workExperiences?: Array<{ id: string }> | null;
  educationEntries?: Array<{ id: string }> | null;
  portfolioProjects?: Array<{ id: string }> | null;
  resumeFiles?: Array<{ id: string; status?: string }> | null;
}

export interface CompletenessResult {
  percent: number;
  missing: string[];
}

/**
 * Calculates profile completeness strictly following the 5 categories (100 points total):
 * 1. Basic (photo, title, headline, bio, location): 35 points (7 points each)
 * 2. Skills: 15 points (at least one skill defined)
 * 3. Experience OR Education: 15 points (at least one work experience or education entry)
 * 4. Availability: 15 points (availabilityStatus defined)
 * 5. Resume OR Portfolio: 20 points (at least one active resume or portfolio project)
 */
export function calculateProfileCompleteness(
  profile: ProfileForCompleteness
): CompletenessResult {
  let score = 0;
  const missing: string[] = [];

  // 1. Basic (35 points total, 7 points each)
  let basicScore = 0;
  const basicMissing: string[] = [];

  if (profile.photoFileId && profile.photoFileId.trim().length > 0) {
    basicScore += 7;
  } else {
    basicMissing.push("photo");
  }

  if (profile.professionalTitle && profile.professionalTitle.trim().length > 0) {
    basicScore += 7;
  } else {
    basicMissing.push("title");
  }

  if (profile.headline && profile.headline.trim().length > 0) {
    basicScore += 7;
  } else {
    basicMissing.push("headline");
  }

  if (profile.bio && profile.bio.trim().length > 0) {
    basicScore += 7;
  } else {
    basicMissing.push("bio");
  }

  if (profile.locationText && profile.locationText.trim().length > 0) {
    basicScore += 7;
  } else {
    basicMissing.push("location");
  }

  score += basicScore;
  if (basicScore < 35) {
    missing.push("basic");
  }

  // 2. Skills (15 points)
  const hasSkills =
    (profile.freelancerSkills && profile.freelancerSkills.length > 0) ||
    (profile.skills && profile.skills.length > 0);
  if (hasSkills) {
    score += 15;
  } else {
    missing.push("skills");
  }

  // 3. Experience OR Education (15 points)
  const hasExperience = profile.workExperiences && profile.workExperiences.length > 0;
  const hasEducation = profile.educationEntries && profile.educationEntries.length > 0;
  if (hasExperience || hasEducation) {
    score += 15;
  } else {
    missing.push("experience_or_education");
  }

  // 4. Availability (15 points)
  if (profile.availabilityStatus && profile.availabilityStatus.trim().length > 0) {
    score += 15;
  } else {
    missing.push("availability");
  }

  // 5. Resume OR Portfolio (20 points)
  const hasResume = profile.resumeFiles && profile.resumeFiles.length > 0;
  const hasPortfolio = profile.portfolioProjects && profile.portfolioProjects.length > 0;
  if (hasResume || hasPortfolio) {
    score += 20;
  } else {
    missing.push("resume_or_portfolio");
  }

  return {
    percent: Math.min(100, Math.max(0, score)),
    missing,
  };
}

