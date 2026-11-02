"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  fetchFreelancerProfile,
  updateBasicProfile,
  updateProfessionalProfile,
  updateSkills,
  createExperience,
  deleteExperience,
  createEducation,
  deleteEducation,
  createCertification,
  deleteCertification,
  createPortfolioProject,
  deletePortfolioProject,
  updateAvailability,
  uploadProfileFile,
  uploadResumeFile,
  fetchPublicProfilePreview,
  ProfileCompleteness,
} from "@/lib/api-client";
import Image from "next/image";
import {
  User,
  Briefcase,
  Globe,
  FolderKanban,
  Building2,
  GraduationCap,
  Award,
  Clock,
  Settings,
  Camera,
  MapPin,
  Download,
  ChevronDown,
  CheckCircle2,
  Circle,
  ExternalLink,
  Star,
  Info,
  Link as LinkIcon,
  X,
  ArrowRight,
  Plus,
  Trash2,
  ShieldCheck,
  DollarSign,
  FileCode,
  Video,
  Upload,
  Pencil,
  ArrowLeft,
  Eye,
  MessageSquare,
  Share2,
  FileText,
  Check,
} from "lucide-react";
import { DemoUser } from "@/lib/auth-types";

interface FreelancerProfileViewProps {
  freelancer: DemoUser;
  showToast: (msg: string) => void;
}

export type ProfileSubTabId =
  | "basic"
  | "professional"
  | "skills"
  | "portfolio"
  | "experience"
  | "education"
  | "certifications"
  | "availability"
  | "preferences";

export interface ServiceOfferingItem {
  id: string;
  title: string;
  active: boolean;
}

export default function FreelancerProfileView({
  freelancer,
  showToast,
}: FreelancerProfileViewProps) {
  // View Mode: "editor" vs. "public_preview" (full dedicated page for clients)
  const [viewMode, setViewMode] = useState<"editor" | "public_preview">("editor");

  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<ProfileSubTabId>("basic");

  // Avatar & Banner State
  const [avatarUrl, setAvatarUrl] = useState<string>(freelancer.avatar || "");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);
  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);

  // Resume State
  const [resumeFile, setResumeFile] = useState<{
    name: string;
    size: string;
    uploadedAt: string;
  } | null>(null);

  // 1. Basic Info State
  const [fullName, setFullName] = useState(freelancer.name || "");
  const [professionalTitle, setProfessionalTitle] = useState(freelancer.title || "");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [resumeVisibility, setResumeVisibility] = useState<"Visible to clients" | "Hidden">("Visible to clients");
  const [liveCompleteness, setLiveCompleteness] = useState<ProfileCompleteness | null>(null);
  const [publicPreviewData, setPublicPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL formatter ensuring https:// protocol
  const formatHttps = (url?: string): string | undefined => {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed.replace(/^http:\/\//i, "https://");
    }
    return `https://${trimmed}`;
  };

  // 2. Professional Details State
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [minFixedRate, setMinFixedRate] = useState<number>(0);
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [englishLevel, setEnglishLevel] = useState("Fluent / Professional Working");
  const [servicesOffered, setServicesOffered] = useState<ServiceOfferingItem[]>([]);
  const [newServiceInput, setNewServiceInput] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceText, setEditingServiceText] = useState("");

  // 3. Skills State
  const [newSkillInput, setNewSkillInput] = useState("");
  const [skillsList, setSkillsList] = useState<Array<{ name: string; level: string; verified: boolean }>>([]);

  // 4. Portfolio Projects State
  const [portfolioProjects, setPortfolioProjects] = useState<Array<{
    id: string;
    title: string;
    role: string;
    timeline: string;
    description: string;
    prUrl?: string;
    demoUrl?: string;
    tags: string[];
    metrics: string;
  }>>([]);

  // 5. Work Experience State
  const [workExperiences, setWorkExperiences] = useState<Array<{
    id: string;
    role: string;
    company: string;
    location: string;
    duration: string;
    current: boolean;
    bullets: string[];
  }>>([]);

  // 6. Education State
  const [educationList, setEducationList] = useState<Array<{
    id: string;
    degree: string;
    institution: string;
    year: string;
    gpa: string;
    details: string;
  }>>([]);

  // 7. Certifications State
  const [certificationsList, setCertificationsList] = useState<Array<{
    id: string;
    title: string;
    issuer: string;
    issueDate: string;
    credentialId: string;
    verified: boolean;
  }>>([]);

  // 8. Availability State
  const [weeklyHours, setWeeklyHours] = useState<number>(0);
  const [availabilityStatus, setAvailabilityStatus] = useState<"Available" | "Limited" | "Not Available">("Available");
  const [timezoneOverlap, setTimezoneOverlap] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");

  // 9. Preferences State
  const [preferredContractType, setPreferredContractType] = useState<"All" | "Fixed-Price Milestones" | "Hourly">("Fixed-Price Milestones");
  const [minClientRating, setMinClientRating] = useState<number>(4.5);
  const [requireEscrowUpfront, setRequireEscrowUpfront] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [publicIndexed, setPublicIndexed] = useState(true);

  // Sub-tabs metadata
  const subTabs = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "professional", label: "Professional Details", icon: Briefcase },
    { id: "skills", label: "Skills", icon: Globe },
    { id: "portfolio", label: "Portfolio", icon: FolderKanban },
    { id: "experience", label: "Work Experience", icon: Building2 },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "certifications", label: "Certifications", icon: Award },
    { id: "availability", label: "Availability", icon: Clock },
    { id: "preferences", label: "Preferences", icon: Settings },
  ] as const;

  // Modals Open State & Inputs
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjRole, setNewProjRole] = useState("Lead Developer");
  const [newProjDescription, setNewProjDescription] = useState("");
  const [newProjGithubUrl, setNewProjGithubUrl] = useState("");
  const [newProjDemoUrl, setNewProjDemoUrl] = useState("");
  const [newProjTags, setNewProjTags] = useState("");
  const [newProjStartMonth, setNewProjStartMonth] = useState("");
  const [newProjEndMonth, setNewProjEndMonth] = useState("");

  const [showAddEducationModal, setShowAddEducationModal] = useState(false);
  const [newEduDegree, setNewEduDegree] = useState("");
  const [newEduInstitution, setNewEduInstitution] = useState("");
  const [newEduFieldOfStudy, setNewEduFieldOfStudy] = useState("");
  const [newEduStartYear, setNewEduStartYear] = useState(new Date().getFullYear().toString());
  const [newEduGraduationYear, setNewEduGraduationYear] = useState("");

  const [showAddCertificationModal, setShowAddCertificationModal] = useState(false);
  const [newCertTitle, setNewCertTitle] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [newCertIssuedMonth, setNewCertIssuedMonth] = useState("");
  const [newCertExpiresMonth, setNewCertExpiresMonth] = useState("");
  const [newCertCredentialId, setNewCertCredentialId] = useState("");
  const [newCertCredentialUrl, setNewCertCredentialUrl] = useState("");

  const [showAddExperienceModal, setShowAddExperienceModal] = useState(false);
  const [newExpRole, setNewExpRole] = useState("");
  const [newExpCompany, setNewExpCompany] = useState("");
  const [newExpLocation, setNewExpLocation] = useState("Remote");
  const [newExpStartMonth, setNewExpStartMonth] = useState("");
  const [newExpEndMonth, setNewExpEndMonth] = useState("");
  const [newExpIsCurrent, setNewExpIsCurrent] = useState(false);
  const [newExpBullets, setNewExpBullets] = useState("");

  // Asynchronous Data Loading
  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetchFreelancerProfile();
      if (res.success && res.profile) {
        const p = res.profile;
        if (p.user?.name) setFullName(p.user.name);
        setProfessionalTitle(p.professionalTitle || "");
        setHeadline(p.headline || "");
        setLocation(p.locationText || "");
        setTimeZone(p.timezone || "");
        setAboutMe(p.bio || "");
        setHourlyRate(p.rateHourlyMinor ? p.rateHourlyMinor / 100 : 0);
        setWeeklyHours(p.weeklyCapacityHours || 0);
        setAvailabilityStatus(
          p.availabilityStatus === "UNAVAILABLE"
            ? "Not Available"
            : p.availabilityStatus === "LIMITED"
            ? "Limited"
            : "Available"
        );
        if (p.photoFileId) {
          setAvatarUrl(`/api/files/${p.photoFileId}`);
        } else {
          setAvatarUrl(freelancer.avatar || "");
        }
        if (p.coverFileId) {
          setBannerUrl(`/api/files/${p.coverFileId}`);
        } else {
          setBannerUrl("");
        }

        // Empty response integrity: explicitly replace state even when arrays are empty
        setServicesOffered(
          (p.servicesOffered || []).map((title, idx) => ({
            id: `srv_${idx}`,
            title,
            active: true,
          }))
        );

        setSkillsList(
          (p.freelancerSkills || []).map((s) => ({
            name: s.skillName,
            level: s.proficiency || "INTERMEDIATE",
            verified: false,
          }))
        );

        setWorkExperiences(
          (p.workExperiences || []).map((e) => ({
            id: e.id,
            role: e.role,
            company: e.company,
            location: e.location || "Remote",
            duration: `${e.startMonth} – ${e.isCurrent ? "Present" : e.endMonth || ""}`,
            current: e.isCurrent,
            bullets: e.description ? [e.description] : [],
          }))
        );

        setEducationList(
          (p.educationEntries || []).map((ed) => ({
            id: ed.id,
            degree: ed.degree,
            institution: ed.institution,
            year: `${ed.startYear || ""}${ed.graduationYear ? ` – ${ed.graduationYear}` : ""}`,
            gpa: "",
            details: ed.fieldOfStudy || "",
          }))
        );

        setCertificationsList(
          (p.certifications || []).map((c) => ({
            id: c.id,
            title: c.name,
            issuer: c.issuer,
            issueDate: `${c.issuedMonth}${c.expiresMonth || c.expiryMonth ? ` · Expires ${c.expiresMonth || c.expiryMonth}` : ""}`,
            credentialId: c.credentialId || "",
            verified: false,
          }))
        );

        setPortfolioProjects(
          (p.portfolioProjects || []).map((port) => ({
            id: port.id,
            title: port.title,
            role: port.role || "Lead Contributor",
            timeline: port.startMonth ? `${port.startMonth}${port.endMonth ? ` – ${port.endMonth}` : ""}` : "",
            description: port.description,
            prUrl: port.repoUrl || undefined,
            demoUrl: port.projectUrl || undefined,
            tags: port.tools || [],
            metrics: "",
          }))
        );

        const userResumes = (p as any).user?.resumeFiles || p.resumeFiles;
        if (userResumes && userResumes.length > 0) {
          const activeRes =
            userResumes.find((r: any) => r.status === "ACTIVE") || userResumes[0];
          const sizeStr =
            activeRes.sizeBytes > 1024 * 1024
              ? `${(activeRes.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.round(activeRes.sizeBytes / 1024)} KB`;
          setResumeFile({
            name: activeRes.originalName,
            size: sizeStr,
            uploadedAt: new Date(activeRes.uploadedAt).toLocaleDateString(),
          });
          setResumeVisibility(activeRes.visibility === "PUBLIC" ? "Visible to clients" : "Hidden");
        } else {
          setResumeFile(null);
        }

        setLiveCompleteness(res.completeness || null);
      } else if (res.error) {
        showToast(res.error);
        setServicesOffered([]);
        setSkillsList([]);
        setWorkExperiences([]);
        setEducationList([]);
        setCertificationsList([]);
        setPortfolioProjects([]);
        setResumeFile(null);
        setLiveCompleteness(null);
      }
    } catch (err) {
      console.warn("Could not load freelancer profile:", err);
      setServicesOffered([]);
      setSkillsList([]);
      setWorkExperiences([]);
      setEducationList([]);
      setCertificationsList([]);
      setPortfolioProjects([]);
      setResumeFile(null);
      setLiveCompleteness(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when authenticated account changes
  useEffect(() => {
    setFullName(freelancer.name || "");
    setProfessionalTitle(freelancer.title || "");
    setAvatarUrl(freelancer.avatar || "");
    setBannerUrl("");
    setResumeFile(null);
    setHeadline("");
    setLocation("");
    setTimeZone("");
    setAboutMe("");
    setHourlyRate(0);
    setMinFixedRate(0);
    setPrimaryDomain("");
    setYearsExperience(0);
    setWeeklyHours(0);
    setServicesOffered([]);
    setSkillsList([]);
    setPortfolioProjects([]);
    setWorkExperiences([]);
    setEducationList([]);
    setCertificationsList([]);
    setLiveCompleteness(null);

    loadData();
  }, [freelancer?.id]);

  // Modal Submit Handlers
  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim() || !newProjDescription.trim()) {
      showToast("Title and Description are required");
      return;
    }
    try {
      const res = await createPortfolioProject({
        title: newProjTitle.trim(),
        role: newProjRole.trim() || "Lead Developer",
        description: newProjDescription.trim(),
        tools: newProjTags.split(",").map((t) => t.trim()).filter(Boolean),
        projectUrl: formatHttps(newProjDemoUrl),
        repoUrl: formatHttps(newProjGithubUrl),
        startMonth: newProjStartMonth.trim() || undefined,
        endMonth: newProjEndMonth.trim() || undefined,
      });
      if (res.success) {
        setShowAddProjectModal(false);
        setNewProjTitle("");
        setNewProjRole("Lead Developer");
        setNewProjDescription("");
        setNewProjGithubUrl("");
        setNewProjDemoUrl("");
        setNewProjTags("");
        setNewProjStartMonth("");
        setNewProjEndMonth("");
        await loadData();
        showToast("Portfolio project added successfully!");
      } else {
        showToast(res.error || "Failed to add portfolio project");
      }
    } catch {
      showToast("Error adding portfolio project");
    }
  };

  const handleAddEducationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEduDegree.trim() || !newEduInstitution.trim()) {
      showToast("Degree and Institution are required");
      return;
    }
    const startYearNum = parseInt(newEduStartYear, 10);
    if (isNaN(startYearNum) || startYearNum < 1950) {
      showToast("Please enter a valid start year (1950 or later)");
      return;
    }
    const gradYearNum = newEduGraduationYear.trim() ? parseInt(newEduGraduationYear, 10) : undefined;
    try {
      const res = await createEducation({
        institution: newEduInstitution.trim(),
        degree: newEduDegree.trim(),
        fieldOfStudy: newEduFieldOfStudy.trim() || undefined,
        startYear: startYearNum,
        graduationYear: gradYearNum,
      });
      if (res.success) {
        setShowAddEducationModal(false);
        setNewEduDegree("");
        setNewEduInstitution("");
        setNewEduFieldOfStudy("");
        setNewEduStartYear(new Date().getFullYear().toString());
        setNewEduGraduationYear("");
        await loadData();
        showToast("Education credential added successfully!");
      } else {
        showToast(res.error || "Failed to add education");
      }
    } catch {
      showToast("Error adding education");
    }
  };

  const handleAddCertificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertTitle.trim() || !newCertIssuer.trim() || !newCertIssuedMonth.trim()) {
      showToast("Certification Name, Issuer, and Issued Month (YYYY-MM) are required");
      return;
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(newCertIssuedMonth.trim())) {
      showToast("Issued month must be in YYYY-MM format (e.g. 2026-01)");
      return;
    }
    if (newCertExpiresMonth.trim() && !/^\d{4}-(0[1-9]|1[0-2])$/.test(newCertExpiresMonth.trim())) {
      showToast("Expiration month must be in YYYY-MM format (e.g. 2028-01)");
      return;
    }
    try {
      const res = await createCertification({
        name: newCertTitle.trim(),
        issuer: newCertIssuer.trim(),
        issuedMonth: newCertIssuedMonth.trim(),
        expiresMonth: newCertExpiresMonth.trim() || undefined,
        credentialId: newCertCredentialId.trim() || undefined,
        credentialUrl: formatHttps(newCertCredentialUrl),
      });
      if (res.success) {
        setShowAddCertificationModal(false);
        setNewCertTitle("");
        setNewCertIssuer("");
        setNewCertIssuedMonth("");
        setNewCertExpiresMonth("");
        setNewCertCredentialId("");
        setNewCertCredentialUrl("");
        await loadData();
        showToast("Certification added successfully!");
      } else {
        showToast(res.error || "Failed to add certification");
      }
    } catch {
      showToast("Error adding certification");
    }
  };

  const handleAddExperienceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpRole.trim() || !newExpCompany.trim() || !newExpStartMonth.trim()) {
      showToast("Role, Company, and Start Month (YYYY-MM) are required");
      return;
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(newExpStartMonth.trim())) {
      showToast("Start month must be in YYYY-MM format (e.g. 2024-01)");
      return;
    }
    if (!newExpIsCurrent && newExpEndMonth.trim() && !/^\d{4}-(0[1-9]|1[0-2])$/.test(newExpEndMonth.trim())) {
      showToast("End month must be in YYYY-MM format (e.g. 2025-12)");
      return;
    }
    try {
      const bullets = newExpBullets
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean);
      const res = await createExperience({
        company: newExpCompany.trim(),
        role: newExpRole.trim(),
        location: newExpLocation.trim() || undefined,
        startMonth: newExpStartMonth.trim(),
        endMonth: newExpIsCurrent ? undefined : (newExpEndMonth.trim() || undefined),
        isCurrent: newExpIsCurrent,
        description: bullets.length > 0 ? bullets.join(". ") : undefined,
      });
      if (res.success) {
        setShowAddExperienceModal(false);
        setNewExpRole("");
        setNewExpCompany("");
        setNewExpLocation("Remote");
        setNewExpStartMonth("");
        setNewExpEndMonth("");
        setNewExpIsCurrent(false);
        setNewExpBullets("");
        await loadData();
        showToast("Work experience added successfully!");
      } else {
        showToast(res.error || "Failed to add experience");
      }
    } catch {
      showToast("Error adding experience");
    }
  };

  // Profile Save Handlers
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const basicRes = await updateBasicProfile({
        professionalTitle,
        headline,
        locationText: location,
        bio: aboutMe,
      });

      const profRes = await updateProfessionalProfile({
        specialization: primaryDomain || undefined,
        servicesOffered: servicesOffered.filter((s) => s.active).map((s) => s.title),
        experienceLevel: yearsExperience >= 6 ? "EXPERT" : yearsExperience >= 4 ? "SENIOR" : yearsExperience >= 2 ? "MID" : "BEGINNER",
      });

      const availRes = await updateAvailability({
        weeklyCapacityHours: weeklyHours,
        availabilityStatus:
          availabilityStatus === "Available"
            ? "AVAILABLE"
            : availabilityStatus === "Limited"
            ? "LIMITED"
            : "UNAVAILABLE",
        rateHourlyMinor: Math.round(hourlyRate * 100),
      });

      if (basicRes.success && profRes.success && availRes.success) {
        await loadData();
        showToast("Profile changes saved successfully! Live preview updated.");
      } else {
        const errorMsg = basicRes.error || profRes.error || availRes.error || "Could not save profile changes";
        showToast(errorMsg);
      }
    } catch {
      showToast("Error saving profile changes");
    }
  };

  const handleSaveProfessional = async () => {
    try {
      const profRes = await updateProfessionalProfile({
        specialization: primaryDomain || undefined,
        servicesOffered: servicesOffered.filter((s) => s.active).map((s) => s.title),
        experienceLevel: yearsExperience >= 6 ? "EXPERT" : yearsExperience >= 4 ? "SENIOR" : yearsExperience >= 2 ? "MID" : "BEGINNER",
      });
      const availRes = await updateAvailability({
        rateHourlyMinor: Math.round(hourlyRate * 100),
      });
      if (profRes.success && availRes.success) {
        await loadData();
        showToast("Professional details and pricing updated.");
      } else {
        showToast(profRes.error || availRes.error || "Failed to save professional details");
      }
    } catch {
      showToast("Error saving professional details");
    }
  };

  const handleSaveAvailability = async () => {
    try {
      const res = await updateAvailability({
        weeklyCapacityHours: weeklyHours,
        availabilityStatus:
          availabilityStatus === "Available"
            ? "AVAILABLE"
            : availabilityStatus === "Limited"
            ? "LIMITED"
            : "UNAVAILABLE",
      });
      if (res.success) {
        await loadData();
        showToast("Availability schedule updated.");
      } else {
        showToast(res.error || "Failed to update availability");
      }
    } catch {
      showToast("Error updating availability");
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    const skillName = newSkillInput.trim();
    if (skillsList.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
      showToast("Skill is already listed in your profile.");
      return;
    }
    const updated = [
      ...skillsList,
      { name: skillName, level: "Intermediate", verified: false },
    ];
    try {
      const mapped = updated.map((s) => ({
        skillName: s.name,
        proficiency: s.level.toUpperCase().includes("EXPERT")
          ? "EXPERT"
          : s.level.toUpperCase().includes("ADVANCED")
          ? "ADVANCED"
          : "INTERMEDIATE",
      }));
      const res = await updateSkills(mapped);
      if (res.success) {
        setNewSkillInput("");
        await loadData();
        showToast("Skill added to profile!");
      } else {
        showToast(res.error || "Failed to add skill");
      }
    } catch {
      showToast("Error adding skill");
    }
  };

  const handleDeleteSkill = async (name: string) => {
    const updated = skillsList.filter((s) => s.name !== name);
    try {
      const mapped = updated.map((s) => ({
        skillName: s.name,
        proficiency: s.level.toUpperCase().includes("EXPERT") ? "EXPERT" : "INTERMEDIATE",
      }));
      const res = await updateSkills(mapped);
      if (res.success) {
        await loadData();
        showToast(`Removed ${name} from skills.`);
      } else {
        showToast(res.error || "Failed to remove skill");
      }
    } catch {
      showToast("Error removing skill");
    }
  };

  // Photo & Banner Handlers
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const res = await uploadProfileFile(file, "PROFILE_PHOTO");
        if (res.success && res.file) {
          await updateBasicProfile({ photoFileId: res.file.id });
          await loadData();
          showToast(`Profile photo updated to "${file.name}"!`);
        } else {
          showToast(res.error || "Photo upload failed");
        }
      } catch {
        showToast("Error uploading photo");
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const res = await uploadProfileFile(file, "PROFILE_COVER");
        if (res.success && res.file) {
          await updateBasicProfile({ coverFileId: res.file.id });
          await loadData();
          showToast(`Profile banner updated to "${file.name}"!`);
        } else {
          showToast(res.error || "Banner upload failed");
        }
      } catch {
        showToast("Error uploading banner");
      }
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const res = await updateBasicProfile({ photoFileId: null });
      if (res.success) {
        await loadData();
        showToast("Profile photo removed.");
      } else {
        showToast(res.error || "Failed to remove photo");
      }
    } catch {
      showToast("Error removing photo");
    }
  };

  // Resume Handlers
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const res = await uploadResumeFile(file);
        if (res.success) {
          await loadData();
          showToast(`Resume "${file.name}" uploaded successfully!`);
        } else {
          showToast(res.error || "Resume upload failed");
        }
      } catch {
        showToast("Error uploading resume");
      }
    }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    showToast("Resume removed from profile.");
  };

  // Service Offerings Handlers with Backend Sync
  const syncServices = async (updated: ServiceOfferingItem[]) => {
    try {
      const res = await updateProfessionalProfile({
        specialization: primaryDomain || undefined,
        servicesOffered: updated.filter((s) => s.active).map((s) => s.title),
      });
      if (res.success) {
        if (res.completeness) setLiveCompleteness(res.completeness);
      }
    } catch (err) {
      console.warn("Service sync warning:", err);
    }
  };

  const handleAddService = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newServiceInput.trim()) return;
    const newSrv: ServiceOfferingItem = {
      id: `srv_${Date.now()}`,
      title: newServiceInput.trim(),
      active: true,
    };
    const updated = [...servicesOffered, newSrv];
    setServicesOffered(updated);
    setNewServiceInput("");
    await syncServices(updated);
    showToast(`Service "${newSrv.title}" added!`);
  };

  const handleToggleService = async (id: string) => {
    const updated = servicesOffered.map((s) =>
      s.id === id ? { ...s, active: !s.active } : s
    );
    setServicesOffered(updated);
    await syncServices(updated);
  };

  const handleDeleteService = async (id: string) => {
    const updated = servicesOffered.filter((s) => s.id !== id);
    setServicesOffered(updated);
    await syncServices(updated);
    showToast("Service offering removed.");
  };

  const handleSaveEditService = async (id: string) => {
    if (!editingServiceText.trim()) return;
    const updated = servicesOffered.map((s) =>
      s.id === id ? { ...s, title: editingServiceText.trim() } : s
    );
    setServicesOffered(updated);
    setEditingServiceId(null);
    await syncServices(updated);
    showToast("Service offering updated.");
  };

  // Deletion Handlers for other sections
  const handleDeleteProject = async (id: string) => {
    try {
      const ok = await deletePortfolioProject(id);
      if (ok) {
        await loadData();
        showToast("Portfolio project removed.");
      } else {
        showToast("Failed to delete portfolio project");
      }
    } catch {
      showToast("Error deleting portfolio project");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      const ok = await deleteExperience(id);
      if (ok) {
        await loadData();
        showToast("Work experience removed.");
      } else {
        showToast("Failed to delete work experience");
      }
    } catch {
      showToast("Error deleting work experience");
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      const ok = await deleteEducation(id);
      if (ok) {
        await loadData();
        showToast("Education record removed.");
      } else {
        showToast("Failed to delete education record");
      }
    } catch {
      showToast("Error deleting education record");
    }
  };

  const handleDeleteCertification = async (id: string) => {
    try {
      const ok = await deleteCertification(id);
      if (ok) {
        await loadData();
        showToast("Certification record removed.");
      } else {
        showToast("Failed to delete certification");
      }
    } catch {
      showToast("Error deleting certification");
    }
  };

  const handleEnterPublicPreview = async () => {
    try {
      const res = await fetchPublicProfilePreview();
      if (res.success && res.publicProfile) {
        setPublicPreviewData(res.publicProfile);
      }
    } catch {
      // Fallback
    }
    setViewMode("public_preview");
  };

  if (viewMode === "public_preview") {
    return (
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs transition active:scale-98 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#4f46e5]" />
              <span>← Back to Profile Editor</span>
            </button>
            <div className="text-xs text-indigo-950 flex items-center gap-1.5 font-semibold">
              <Eye className="w-4 h-4 text-[#4f46e5]" />
              <span>Dedicated Client Perspective (Live Preview)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast("Profile link copied to clipboard!");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>
            <button
              type="button"
              onClick={() => showToast("Opened milestone contract builder for " + fullName)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Hire Freelancer</span>
            </button>
          </div>
        </div>

        {/* Hero Banner & Identity Header */}
        <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {/* Banner */}
          <div
            className="w-full h-44 sm:h-52 bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] relative flex items-end p-4 sm:p-6"
            style={
              bannerUrl
                ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          </div>

          {/* Profile Identity Row */}
          <div className="p-5 sm:p-7 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
              <div className="flex items-end gap-4">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 ring-2 ring-slate-200 shrink-0 flex items-center justify-center">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={fullName || "Freelancer"}
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}
                </div>

                <div className="pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {fullName || "Freelancer"}
                    </h1>
                    {freelancer.verified && (
                      <span className="w-5 h-5 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-xs font-bold" title="Verified Professional">
                        ✓
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {availabilityStatus === "Available" ? "Available for hire" : availabilityStatus}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {professionalTitle || "Freelancer Profile"}
                  </p>
                  {headline && (
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      {headline}
                    </p>
                  )}
                </div>
              </div>

              {/* Rate & Action */}
              <div className="flex items-center gap-3 sm:self-center shrink-0">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-[#4f46e5] font-mono">${hourlyRate}.00/hr</div>
                  {minFixedRate > 0 && (
                    <div className="text-[11px] text-slate-400 font-medium">Min milestone ${minFixedRate}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Opened direct message channel.")}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Message</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast("Initiated milestone contract for " + fullName)}
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Hire Now</span>
                </button>
              </div>
            </div>

            {/* Quick Metadata Strip */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-5 mt-5 border-t border-slate-100 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{location || "Location not specified"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{timeZone || "Timezone not specified"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{weeklyHours} hrs/week capacity</span>
              </span>
              {englishLevel && (
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span>English:</span>
                  <span className="text-indigo-600 font-bold">{englishLevel}</span>
                </span>
              )}
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#4f46e5] hover:underline font-mono">
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#4f46e5] hover:underline">
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Performance Strip */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Platform Profile</span>
              </div>
              <span>•</span>
              <span className="font-mono">{portfolioProjects.length} Portfolio Projects</span>
              <span>•</span>
              <span className="font-mono">{skillsList.length} Technical Skills</span>
              <span>•</span>
              <span className="font-mono">{certificationsList.length} Certifications</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              {publicPreviewData?.stats?.reviewsCount ? `${publicPreviewData.stats.reviewsCount} Client Reviews` : "No public client reviews recorded yet"}
            </div>
          </div>
        </div>

        {/* Main 2-Column Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main 8 cols */}
          <div className="lg:col-span-8 space-y-6">
            {/* About Me */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <User className="w-4 h-4 text-[#4f46e5]" />
                <span>About The Professional</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {aboutMe || "No professional summary provided yet."}
              </p>
              {(primaryDomain || yearsExperience > 0) && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
                  {primaryDomain && <div><span className="font-bold text-slate-700">Domain Expertise:</span> {primaryDomain}</div>}
                  {yearsExperience > 0 && <div><span className="font-bold text-slate-700">Experience:</span> {yearsExperience}+ Years</div>}
                </div>
              )}
            </div>

            {/* Verified Service Offerings */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#4f46e5]" />
                  <span>Service Offerings</span>
                </h3>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {servicesOffered.filter((s) => s.active).length} Active
                </span>
              </div>
              {servicesOffered.filter((s) => s.active).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {servicesOffered.filter((s) => s.active).map((srv) => (
                    <div key={srv.id} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-semibold text-slate-800">{srv.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">No active service offerings configured yet.</p>
              )}
            </div>

            {/* Featured Portfolio Projects */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-[#4f46e5]" />
                  <span>Portfolio Projects ({portfolioProjects.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Verifiable Code & Demos</span>
              </div>
              {portfolioProjects.length > 0 ? (
                <div className="space-y-4">
                  {portfolioProjects.map((proj) => (
                    <div key={proj.id} className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-3 hover:border-indigo-300 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          {proj.role && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                              {proj.role} {proj.timeline ? `• ${proj.timeline}` : ""}
                            </span>
                          )}
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">{proj.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {proj.prUrl && (
                            <a href={proj.prUrl} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition">
                              <FileCode className="w-3.5 h-3.5 text-slate-500" />
                              <span>Repository</span>
                            </a>
                          )}
                          {proj.demoUrl && (
                            <a href={proj.demoUrl} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 flex items-center gap-1.5 transition">
                              <Video className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Live Demo</span>
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                      {proj.tags && proj.tags.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-xs">
                          {proj.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-white text-slate-600 text-[10px] font-medium border border-slate-200">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3">No portfolio projects published yet.</p>
              )}
            </div>

            {/* Work Experience */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#4f46e5]" />
                <span>Work Experience & Contracts ({workExperiences.length})</span>
              </h3>
              {workExperiences.length > 0 ? (
                <div className="space-y-5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {workExperiences.map((exp) => (
                    <div key={exp.id} className="relative pl-9 space-y-1.5 text-xs">
                      <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-white border-4 border-[#4f46e5]" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-bold text-sm text-slate-900">{exp.role} • <span className="text-indigo-600">{exp.company}</span></h4>
                        <span className="font-mono text-slate-400 text-[11px]">{exp.duration}</span>
                      </div>
                      {exp.location && <div className="text-slate-500">{exp.location}</div>}
                      {exp.bullets && exp.bullets.length > 0 && (
                        <ul className="space-y-1 pt-1 text-slate-600">
                          {exp.bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-indigo-600 font-bold">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3">No work experiences listed yet.</p>
              )}
            </div>

            {/* Education & Certifications Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#4f46e5]" />
                  <span>Education ({educationList.length})</span>
                </h3>
                {educationList.length > 0 ? (
                  <div className="space-y-3">
                    {educationList.map((edu) => (
                      <div key={edu.id} className="text-xs space-y-1">
                        <div className="font-bold text-slate-900">{edu.degree}</div>
                        <div className="text-slate-600">{edu.institution} {edu.year ? `• ${edu.year}` : ""}</div>
                        {edu.details && <p className="text-slate-500 text-[11px]">{edu.details}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-2">No education credentials listed.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#4f46e5]" />
                  <span>Certifications ({certificationsList.length})</span>
                </h3>
                {certificationsList.length > 0 ? (
                  <div className="space-y-2.5">
                    {certificationsList.map((cert) => (
                      <div key={cert.id} className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs space-y-1">
                        <div className="font-bold text-slate-900">
                          {cert.title}
                        </div>
                        <div className="text-[11px] text-slate-500">{cert.issuer} {cert.issueDate ? `• ${cert.issueDate}` : ""}</div>
                        {cert.credentialId && <div className="font-mono text-[10px] text-slate-400">ID: {cert.credentialId}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-2">No certifications recorded.</p>
                )}
              </div>
            </div>

            {/* Technical Skills Matrix */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#4f46e5]" />
                <span>Technical Skills ({skillsList.length})</span>
              </h3>
              {skillsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill) => (
                    <span key={skill.name} className="px-3 py-1.5 rounded-xl bg-indigo-50/70 text-[#4f46e5] font-bold text-xs border border-indigo-100 flex items-center gap-1.5">
                      <span>{skill.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({skill.level})</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">No technical skills listed.</p>
              )}
            </div>
          </div>

          {/* Right 4 cols: Client Actions, Security & Availability */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-6 lg:self-start">
            {/* Action Card */}
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/70 to-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engagement Rate</span>
                <span className="text-xl font-extrabold text-[#4f46e5] font-mono">${hourlyRate}.00/hr</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Available for hourly retainers and fixed milestone projects with escrow deposit backing.
              </p>
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => showToast("Opened milestone contract builder for " + fullName)}
                  className="w-full py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Hire Freelancer</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast("Initiated direct client conversation.")}
                  className="w-full py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span>Send Direct Message</span>
                </button>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Typical response time: under 1 hour</span>
              </div>
            </div>

            {/* Nexum Escrow Consensus Guarantee */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-[#4f46e5]" />
                <span>Nexum Escrow Guarantee</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Your funds remain safely locked in PayPal Escrow. Work is submitted with dual SHA-256 state consensus and is only released upon your explicit signoff.
              </p>
              <div className="space-y-1.5 pt-1 text-[11px] text-slate-700 font-medium">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% Milestone Protection</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Idempotent Settlement Relays</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cryptographic Signatures</div>
              </div>
            </div>

            {/* Availability & Overlap */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#4f46e5]" />
                <span>Availability & Working Hours</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Weekly Commitment:</span>
                  <span className="font-bold text-slate-900">{weeklyHours} hrs / week</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Timezone Overlap:</span>
                  <span className="font-bold text-slate-900">{timezoneOverlap}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Notice Period:</span>
                  <span className="font-bold text-slate-900">{noticePeriod}</span>
                </div>
              </div>
            </div>

            {/* Resume / CV Download */}
            {resumeFile && resumeVisibility === "Visible to clients" && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Resume & Technical CV</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate text-[11px]">{resumeFile.name}</div>
                    <div className="text-[10px] text-slate-400">{resumeFile.size}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast(`Downloading ${resumeFile.name}...`)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[#4f46e5] font-bold text-[11px] shadow-2xs transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ==============================================================
          1. PAGE HEADER ROW: TITLE, SUBTITLE & TOP-RIGHT ACTION
         ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Profile & Portfolio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Showcase your skills, experience and work to attract the right clients.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEnterPublicPreview}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Public Profile</span>
        </button>
      </div>

      {/* ==============================================================
          2. HORIZONTAL SUB-TABS NAVIGATION BAR
         ============================================================== */}
      <div className="border-b border-slate-200 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 sm:gap-2 min-w-max">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSubTab(tab.id);
                  showToast(`Switched to ${tab.label}`);
                }}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? "border-[#4f46e5] text-[#4f46e5] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#4f46e5]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ==============================================================
          3. MAIN TWO-COLUMN LAYOUT: DYNAMIC FORM/PAGE + PREVIEW/COMPLETION
         ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================
            LEFT COLUMN (~65% / 8 OF 12 COLS): DYNAMIC SUB-TAB CONTENT
           ============================================================ */}
        <div className="lg:col-span-8 space-y-6">
          {/* ----------------------------------------------------------
              SUB-TAB 1: BASIC INFO
             ---------------------------------------------------------- */}
          {activeSubTab === "basic" && (
            <form onSubmit={handleSaveChanges} className="space-y-6">
              {/* Card 1: Profile Photo & Banner */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Profile Photo & Banner
                </h2>

                {/* Hidden File Pickers */}
                <input
                  type="file"
                  ref={bannerFileInputRef}
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                {/* Decorative Wallpaper Banner */}
                <div
                  className="relative w-full h-32 sm:h-36 rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] shadow-inner border border-slate-200/60 p-3 sm:p-4"
                  style={
                    bannerUrl
                      ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : undefined
                  }
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/30 pointer-events-none" />
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col items-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold border border-white/25 shadow-xs transition active:scale-98 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Change Banner</span>
                    </button>
                    <span className="text-[10px] text-white/70 font-medium">
                      Recommended size: 1600 × 400 (JPG, PNG up to 5MB)
                    </span>
                  </div>
                </div>

                {/* Avatar + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-10 sm:-mt-12 pl-2">
                  <div className="flex items-end gap-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white shadow-md shrink-0 bg-slate-100 ring-2 ring-slate-200/60">
                      <Image
                        src={avatarUrl}
                        alt={fullName}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="pb-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">JPG, PNG up to 5MB</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Card 2: Basic Information Form */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Professional Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={professionalTitle}
                      onChange={(e) => setProfessionalTitle(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Headline (Visible to clients) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {headline.length}/120
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={120}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Location</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Time Zone</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={timeZone}
                        onChange={(e) => setTimeZone(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 appearance-none focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs cursor-pointer"
                      >
                        <option value="(GMT+5:30) India Standard Time">
                          (GMT+5:30) India Standard Time
                        </option>
                        <option value="(GMT-5:00) Eastern Time (US & Canada)">
                          (GMT-5:00) Eastern Time (US & Canada)
                        </option>
                        <option value="(GMT+0:00) Greenwich Mean Time (London)">
                          (GMT+0:00) Greenwich Mean Time (London)
                        </option>
                        <option value="(GMT+1:00) Central European Time (Berlin)">
                          (GMT+1:00) Central European Time (Berlin)
                        </option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      About Me <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {aboutMe.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs resize-none leading-relaxed"
                  />
                </div>
              </section>

              {/* Card 3: Account Links */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Account Links
                  </h2>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Phase 3 Roadmap / Unpersisted
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Notice: External social profile links (LinkedIn, GitHub, Website) are UI preview fields not stored in the current Phase 2 FreelancerProfile schema. They are scheduled for Phase 3.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">LinkedIn</label>
                    <div className="relative">
                      <span className="w-5 h-5 rounded bg-[#0a66c2] text-white text-[11px] font-bold flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        in
                      </span>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">GitHub</label>
                    <div className="relative">
                      <span className="w-5 h-5 rounded bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        git
                      </span>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Website (Optional)</label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourdomain.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Card 4: Resume */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Resume & Technical CV
                  </h2>
                  <span className="text-[11px] text-slate-400">PDF, DOC, DOCX up to 5MB</span>
                </div>

                <input
                  type="file"
                  ref={resumeFileInputRef}
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                />

                {resumeFile ? (
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">
                          {resumeFile.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Uploaded on {resumeFile.uploadedAt} • {resumeFile.size}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => resumeFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => showToast(`Downloading ${resumeFile.name}...`)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveResume}
                        className="p-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 shadow-2xs transition cursor-pointer"
                        title="Remove resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="relative">
                        <select
                          value={resumeVisibility}
                          onChange={(e) =>
                            setResumeVisibility(
                              e.target.value as "Visible to clients" | "Hidden"
                            )
                          }
                          className="px-3 py-1.5 pr-7 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition cursor-pointer appearance-none"
                        >
                          <option value="Visible to clients">Visible to clients</option>
                          <option value="Hidden">Hidden</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => resumeFileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#4f46e5] bg-slate-50/50 hover:bg-indigo-50/30 text-center transition cursor-pointer space-y-2"
                  >
                    <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Upload your latest CV / Resume
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PDF, DOC or DOCX up to 5MB. Clients can view or download.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-xl bg-[#4f46e5] text-white text-xs font-bold shadow-xs hover:bg-[#4338ca] transition cursor-pointer"
                    >
                      Browse File
                    </button>
                  </div>
                )}
              </section>

              {/* Bottom Save Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                <div className="flex items-center gap-2 text-xs text-indigo-900">
                  <Info className="w-4 h-4 text-[#4f46e5] shrink-0" />
                  <span>Keep your profile updated to get better project recommendations and attract more clients.</span>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-98 cursor-pointer shrink-0"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 2: PROFESSIONAL DETAILS
             ---------------------------------------------------------- */}
          {activeSubTab === "professional" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Professional Details & Pricing
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define your billing rates, domain expertise, and core service offerings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveProfessional}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold shadow-xs hover:bg-[#4338ca] transition cursor-pointer"
                >
                  Save Rates & Details
                </button>
              </div>

              {/* Rates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Hourly Rate (USD)</span>
                    <span className="font-mono text-indigo-600 font-extrabold text-sm">${hourlyRate}/hr</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Clients will see ${hourlyRate}.00/hr as your base contract rate.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Minimum Fixed-Price Milestone</span>
                    <span className="font-mono text-emerald-600 font-extrabold text-sm">${minFixedRate}</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={minFixedRate}
                      onChange={(e) => setMinFixedRate(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    UI Preview only (Phase 3 Roadmap). Minimum budget required for fixed-scope escrow milestones.
                  </p>
                </div>
              </div>

              {/* Domain & Languages */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Primary Industry Domain</label>
                  <input
                    type="text"
                    value={primaryDomain}
                    onChange={(e) => setPrimaryDomain(e.target.value)}
                    placeholder="e.g. Fintech, Web3, Distributed Systems"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Years Experience</label>
                  <div className="relative">
                    <select
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 appearance-none focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value={0}>Entry / Beginner</option>
                      <option value={2}>2+ Years (Junior / Mid)</option>
                      <option value={4}>4+ Years (Mid / Senior)</option>
                      <option value={6}>6+ Years (Senior Lead)</option>
                      <option value={10}>10+ Years (Principal / Staff)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">English Proficiency</label>
                  <div className="relative">
                    <select
                      value={englishLevel}
                      onChange={(e) => setEnglishLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 appearance-none focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Fluent / Professional Working">Fluent / Professional Working</option>
                      <option value="Native / Bilingual">Native / Bilingual</option>
                      <option value="Conversational">Conversational</option>
                      <option value="Basic">Basic</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Service Offerings */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Service Offerings ({servicesOffered.length})
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Add, edit or pause specialized service offerings matched by AI
                    </p>
                  </div>
                </div>

                {/* Add Service Bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Bilateral Settlement Rails & Payment Webhooks..."
                    value={newServiceInput}
                    onChange={(e) => setNewServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddService();
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-4 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Offering</span>
                  </button>
                </div>

                {/* Service Offerings List */}
                {servicesOffered.length > 0 ? (
                  <div className="space-y-2">
                    {servicesOffered.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs hover:border-[#4f46e5]/30 transition group"
                      >
                        {editingServiceId === service.id ? (
                          <div className="flex items-center gap-2 flex-1 mr-3">
                            <input
                              type="text"
                              value={editingServiceText}
                              onChange={(e) => setEditingServiceText(e.target.value)}
                              className="flex-1 px-3 py-1 rounded-lg border border-indigo-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEditService(service.id);
                                if (e.key === "Escape") setEditingServiceId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditService(service.id)}
                              className="p-1.5 rounded-lg bg-[#4f46e5] text-white hover:bg-[#4338ca] transition cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingServiceId(null)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 font-semibold text-slate-800">
                            <CheckCircle2
                              className={`w-4 h-4 shrink-0 ${
                                service.active ? "text-emerald-600" : "text-slate-300"
                              }`}
                            />
                            <span
                              className={
                                service.active
                                  ? "text-slate-900"
                                  : "text-slate-400 line-through"
                              }
                            >
                              {service.title}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleService(service.id)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                              service.active
                                ? "text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
                                : "text-slate-400 bg-slate-100 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {service.active ? "Active Offering" : "Paused"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingServiceId(service.id);
                              setEditingServiceText(service.title);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title="Edit offering"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteService(service.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete offering"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-1">
                    <p className="text-xs text-slate-500">No service offerings configured yet.</p>
                    <p className="text-[11px] text-slate-400">Add service offerings above to define what you build for clients.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 3: SKILLS
             ---------------------------------------------------------- */}
          {activeSubTab === "skills" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Technical Skills Matrix
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Skills indexed by our AI matching engine to recommend top contracts.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {skillsList.length} Skills Added
                </span>
              </div>

              {/* Add New Skill Input */}
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  placeholder="Type a skill or framework (e.g. GraphQL, Tailwind, Solidity)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </form>

              {/* Skills Grid */}
              {skillsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {skillsList.map((skill) => (
                    <div
                      key={skill.name}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-white hover:border-indigo-300 transition-all flex items-center justify-between gap-3 text-xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[#4f46e5] shrink-0 shadow-2xs">
                          #
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {skill.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">{skill.level}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(skill.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-1">
                  <p className="text-xs text-slate-500">No technical skills added yet.</p>
                  <p className="text-[11px] text-slate-400">Add languages, libraries and technologies using the input above.</p>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 4: PORTFOLIO
             ---------------------------------------------------------- */}
          {activeSubTab === "portfolio" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Portfolio Projects ({portfolioProjects.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showcase verifiable work deliverables with pull requests and live demonstrations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {portfolioProjects.length > 0 ? (
                <div className="space-y-4">
                  {portfolioProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#4f46e5]/40 hover:shadow-xs transition-all space-y-3.5 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          {proj.role && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">
                              {proj.role} {proj.timeline ? `· ${proj.timeline}` : ""}
                            </span>
                          )}
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-[#4f46e5] transition-colors mt-1">
                            {proj.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          {proj.prUrl && (
                            <a
                              href={proj.prUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                            >
                              <FileCode className="w-3.5 h-3.5 text-slate-500" />
                              <span>Repository</span>
                            </a>
                          )}
                          {proj.demoUrl && (
                            <a
                              href={proj.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 flex items-center gap-1 transition"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Demo</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {proj.description}
                      </p>

                      {proj.tags && proj.tags.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-xs">
                          {proj.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-medium border border-slate-200"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#4f46e5] flex items-center justify-center mx-auto">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Portfolio Projects Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Showcase your deliverables, repositories, and live video demonstrations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddProjectModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Project</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 5: WORK EXPERIENCE
             ---------------------------------------------------------- */}
          {activeSubTab === "experience" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Work Experience ({workExperiences.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Employment contracts and professional track record.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExperienceModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>

              {workExperiences.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {workExperiences.map((exp) => (
                    <div key={exp.id} className="relative pl-9 space-y-2">
                      <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-white border-4 border-[#4f46e5]" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">
                          {exp.role} · <span className="text-indigo-600">{exp.company}</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400">{exp.duration}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(exp.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete work experience"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {exp.location && <div className="text-xs text-slate-500">{exp.location}</div>}
                      {exp.bullets && exp.bullets.length > 0 && (
                        <ul className="space-y-1.5 pt-1 text-xs text-slate-600">
                          {exp.bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-indigo-600 font-bold">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#4f46e5] flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Work Experience Listed</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Document your employment background and past client deliverables.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddExperienceModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Experience</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 6: EDUCATION
             ---------------------------------------------------------- */}
          {activeSubTab === "education" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Education & Degrees ({educationList.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Academic degrees and university coursework.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddEducationModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Education</span>
                </button>
              </div>

              {educationList.length > 0 ? (
                <div className="space-y-4">
                  {educationList.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{edu.degree}</h3>
                          <p className="text-slate-600 font-medium mt-0.5">{edu.institution}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[11px]">{edu.year}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteEducation(edu.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete education record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {edu.details && <p className="text-slate-500">{edu.details}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#4f46e5] flex items-center justify-center mx-auto">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Education Credentials</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Add degrees, university programs, and academic qualifications.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddEducationModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Education</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 7: CERTIFICATIONS
             ---------------------------------------------------------- */}
          {activeSubTab === "certifications" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Certifications & Licenses ({certificationsList.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Technical certifications and specialized vendor credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCertificationModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Certification</span>
                </button>
              </div>

              {certificationsList.length > 0 ? (
                <div className="space-y-3">
                  {certificationsList.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4f46e5] flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {cert.title}
                          </h3>
                          <p className="text-slate-500 mt-0.5">{cert.issuer} · {cert.issueDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {cert.credentialId && (
                          <div className="font-mono text-[11px] text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                            ID: {cert.credentialId}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteCertification(cert.id)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete certification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#4f46e5] flex items-center justify-center mx-auto">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Certifications Recorded</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Add cloud, database, or technical credentials to demonstrate competence.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCertificationModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Certification</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 8: AVAILABILITY
             ---------------------------------------------------------- */}
          {activeSubTab === "availability" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Work Availability & Working Hours
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Control your capacity and client contract matching status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAvailability}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>

              {/* Status Radio Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Current Work Status</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { id: "Available", label: "Available for Work", desc: "Actively taking contracts", color: "emerald" },
                    { id: "Limited", label: "Limited Availability", desc: "Part-time only (<15 hrs)", color: "amber" },
                    { id: "Not Available", label: "Busy / Unavailable", desc: "Fully booked right now", color: "rose" },
                  ] as const).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setAvailabilityStatus(st.id)}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        availabilityStatus === st.id
                          ? "border-[#4f46e5] bg-indigo-50/60 ring-2 ring-indigo-100"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                        <span>{st.label}</span>
                        {availabilityStatus === st.id && (
                          <span className="w-2 h-2 rounded-full bg-[#4f46e5]" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity Slider */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Weekly Capacity</span>
                  <span className="font-mono text-indigo-700 font-extrabold text-sm">{weeklyHours} hrs / week</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Part-time (10 hrs)</span>
                  <span>Standard (35-40 hrs)</span>
                  <span>Full-time+ (50+ hrs)</span>
                </div>
              </div>

              {/* Overlap & Notice Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Primary Timezone Overlap</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={timezoneOverlap}
                      onChange={(e) => setTimezoneOverlap(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 appearance-none focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs cursor-pointer"
                    >
                      <option value="US Eastern (EST) & European (CET)">US Eastern (EST) & European (CET)</option>
                      <option value="US Pacific (PST) & Eastern (EST)">US Pacific (PST) & Eastern (EST)</option>
                      <option value="European (GMT / CET) & India (IST)">European (GMT / CET) & India (IST)</option>
                      <option value="Asia-Pacific (AEST / SGT) & India (IST)">Asia-Pacific (AEST / SGT) & India (IST)</option>
                      <option value="Global / Flexible Overlap (24/7 Asynchronous)">Global / Flexible Overlap (24/7 Asynchronous)</option>
                      <option value="US Timezones Only (PST / MST / CST / EST)">US Timezones Only (PST / MST / CST / EST)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Notice Period for New Milestones</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 appearance-none focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs cursor-pointer"
                    >
                      <option value="Immediate Start (Available now)">Immediate Start (Available now)</option>
                      <option value="24 – 48 Hours Notice">24 – 48 Hours Notice</option>
                      <option value="3 – 5 Days Notice">3 – 5 Days Notice</option>
                      <option value="1 – 2 Weeks Notice">1 – 2 Weeks Notice</option>
                      <option value="Flexible / Milestone Dependent">Flexible / Milestone Dependent</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 9: PREFERENCES
             ---------------------------------------------------------- */}
          {activeSubTab === "preferences" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Contract & Account Preferences
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Safety rails and escrow requirements for prospective clients.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Preferences updated.")}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>

              <div className="space-y-4">
                {/* Contract Structure Preference */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <label className="text-xs font-bold text-slate-700">Preferred Contract Structure</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {([
                      { id: "Fixed-Price Milestones", label: "Fixed Milestones" },
                      { id: "Hourly", label: "Hourly Retainer" },
                      { id: "All", label: "Both (Any)" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPreferredContractType(opt.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer text-center ${
                          preferredContractType === opt.id
                            ? "bg-[#4f46e5] text-white border-[#4f46e5] shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">Nexum will prioritize project recommendations that match this billing format.</p>
                </div>

                {/* Min Client Rating Requirement */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Minimum Client Rating Benchmark</label>
                    <span className="text-xs font-bold font-mono text-amber-600 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {minClientRating.toFixed(1)}+ Stars
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3.5}
                    max={4.9}
                    step={0.1}
                    value={minClientRating}
                    onChange={(e) => setMinClientRating(parseFloat(e.target.value))}
                    className="w-full accent-[#4f46e5] cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400">Auto-filter inbound client invitations below this threshold.</p>
                </div>

                {/* Escrow Rule */}
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={requireEscrowUpfront}
                    onChange={(e) => setRequireEscrowUpfront(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-[#4f46e5] rounded border-slate-300"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#4f46e5]" />
                      <span>Strict PayPal Escrow Milestone Pre-Funding</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Never accept work start until client milestone deposit is cryptographically verified in escrow.
                    </p>
                  </div>
                </label>

                {/* Email Alerts */}
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-[#4f46e5] rounded border-slate-300"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">
                      Real-Time Proposal & Counteroffer Notifications
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Receive immediate webhook emails when clients shortlist, review, or release milestone funds.
                    </p>
                  </div>
                </label>

                {/* Public Indexing */}
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={publicIndexed}
                    onChange={(e) => setPublicIndexed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-[#4f46e5] rounded border-slate-300"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">
                      Public Search Indexing & Nexum AI Matching
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Allow your verified profile to be matched with high-budget client briefs automatically.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            RIGHT COLUMN (~35% / 4 OF 12 COLS): PREVIEW & COMPLETION
           ============================================================ */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Card 1: Public Profile Preview */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Public Profile Preview
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                This is how clients will see your profile on Nexum.
              </p>
            </div>

            {/* Preview Box Container */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-4 text-xs">
              {/* Avatar + Name + Title */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 ring-1 ring-slate-200 flex items-center justify-center bg-slate-100">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={fullName || "Freelancer"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {fullName || "Freelancer"}
                    </h4>
                    {freelancer.verified && (
                      <span className="w-4 h-4 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-[10px] font-bold shrink-0" title="Verified">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {headline || professionalTitle || "Freelancer Profile"}
                  </p>
                </div>
              </div>

              {/* Status & Location */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{availabilityStatus === "Available" ? "Available for hire" : availabilityStatus}</span>
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{location ? location.split(",")[0] : "Location not set"}</span>
                </span>
                {timeZone && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{timeZone.split(" ")[0]}</span>
                  </span>
                )}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-200/60 text-center">
                <div>
                  <div className="font-extrabold text-sm text-slate-900 font-mono">{portfolioProjects.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Projects</div>
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 font-mono">{skillsList.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Skills</div>
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 font-mono">{certificationsList.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Certs</div>
                </div>
              </div>

              {/* Bio Preview Snippet */}
              <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                {aboutMe || "No summary provided yet."}
              </p>

              {/* Skills Tags */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-700 block">Skills</span>
                {skillsList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.slice(0, 8).map((s) => (
                      <span
                        key={s.name}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-[10px] font-medium text-slate-700 shadow-2xs"
                      >
                        {s.name}
                      </span>
                    ))}
                    {skillsList.length > 8 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-600 bg-indigo-50">
                        +{skillsList.length - 8} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">No skills added yet</p>
                )}
              </div>

              {/* View Full Profile Button */}
              <button
                type="button"
                onClick={handleEnterPublicPreview}
                className="w-full py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer mt-2 flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Profile</span>
              </button>
            </div>
          </section>

          {/* Card 2: Profile Completion Progress */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Profile Completion
              </h3>
              <span className="text-sm font-extrabold text-[#4f46e5] font-mono">
                {liveCompleteness ? `${liveCompleteness.percent}%` : "0%"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#4f46e5] transition-all duration-500"
                style={{ width: `${liveCompleteness ? liveCompleteness.percent : 0}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-xs pt-1">
              {[
                { tabId: "basic", label: "Basic information", isDone: liveCompleteness ? ((liveCompleteness.breakdown?.basic?.score ?? 0) >= 20) : false },
                { tabId: "skills", label: `Skills (${skillsList.length}/10)`, isDone: liveCompleteness ? ((liveCompleteness.breakdown?.skills?.score ?? 0) >= 15) : false },
                { tabId: "portfolio", label: `Portfolio projects (${portfolioProjects.length})`, isDone: portfolioProjects.length > 0 },
                { tabId: "experience", label: `Work experience (${workExperiences.length})`, isDone: workExperiences.length > 0 },
                { tabId: "certifications", label: `Certifications (${certificationsList.length})`, isDone: certificationsList.length > 0 },
                { tabId: "availability", label: "Availability & preferences", isDone: liveCompleteness ? ((liveCompleteness.breakdown?.availability?.score ?? 0) >= 15) : false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 transition"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab(item.tabId as ProfileSubTabId);
                      showToast(`Navigated to ${item.label}`);
                    }}
                    className="flex items-center gap-2 cursor-pointer text-left"
                  >
                    {item.isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className={item.isDone ? "text-slate-800 font-medium hover:text-[#4f46e5]" : "text-slate-500"}>
                      {item.label}
                    </span>
                  </button>

                  {item.isDone ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      Complete
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab(item.tabId as ProfileSubTabId);
                        showToast(`Jumped to ${item.label} section.`);
                      }}
                      className="text-[11px] font-bold text-[#4f46e5] hover:underline cursor-pointer"
                    >
                      + Add
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Lightbulb Standout Callout */}
            <div className="pt-2">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <span className="text-base leading-none">💡</span>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-amber-950">Make your profile stand out</div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    Add verified portfolio projects, skills and certifications to improve matching.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab("portfolio");
                      showToast("Jumped to Portfolio projects.");
                    }}
                    className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                  >
                    <span>Improve Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* ==============================================================
          5. ADD PORTFOLIO PROJECT MODAL
         ============================================================== */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Portfolio Project</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showcase verifiable work deliverables to clients.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProjectModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProjectSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Payment Settlement Gateway"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Your Role</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Developer / Contributor"
                  value={newProjRole}
                  onChange={(e) => setNewProjRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Month (YYYY-MM)</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-01"
                    pattern="\d{4}-(0[1-9]|1[0-2])"
                    value={newProjStartMonth}
                    onChange={(e) => setNewProjStartMonth(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Month (YYYY-MM)</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-06"
                    pattern="\d{4}-(0[1-9]|1[0-2])"
                    value={newProjEndMonth}
                    onChange={(e) => setNewProjEndMonth(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Project Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize the core technical problem solved, architecture choices, and deliverables produced..."
                  value={newProjDescription}
                  onChange={(e) => setNewProjDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Repository URL (https://)</label>
                  <input
                    type="url"
                    placeholder="https://github.com/org/repo"
                    value={newProjGithubUrl}
                    onChange={(e) => setNewProjGithubUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Live Demo URL (https://)</label>
                  <input
                    type="url"
                    placeholder="https://project.example.com"
                    value={newProjDemoUrl}
                    onChange={(e) => setNewProjDemoUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tech Stack Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="React 19, TypeScript, Next.js, Node.js"
                  value={newProjTags}
                  onChange={(e) => setNewProjTags(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          6. ADD EDUCATION MODAL
         ============================================================== */}
      {showAddEducationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Academic Credential</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add university degrees and academic honors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEducationModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEducationSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Degree & Specialization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bachelor of Technology in Computer Science"
                  value={newEduDegree}
                  onChange={(e) => setNewEduDegree(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Institution / University *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University of California, Berkeley"
                  value={newEduInstitution}
                  onChange={(e) => setNewEduInstitution(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Field of Study</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineering & Systems"
                  value={newEduFieldOfStudy}
                  onChange={(e) => setNewEduFieldOfStudy(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Year * (YYYY)</label>
                  <input
                    type="number"
                    min={1950}
                    max={new Date().getFullYear() + 8}
                    required
                    placeholder="e.g. 2020"
                    value={newEduStartYear}
                    onChange={(e) => setNewEduStartYear(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Graduation Year (YYYY, optional)</label>
                  <input
                    type="number"
                    min={1950}
                    max={new Date().getFullYear() + 8}
                    placeholder="e.g. 2024"
                    value={newEduGraduationYear}
                    onChange={(e) => setNewEduGraduationYear(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEducationModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Education
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          7. ADD CERTIFICATION MODAL
         ============================================================== */}
      {showAddCertificationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Professional Certification</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record specialized technical licenses and credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCertificationModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCertificationSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Certification Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={newCertTitle}
                  onChange={(e) => setNewCertTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Issuing Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services"
                  value={newCertIssuer}
                  onChange={(e) => setNewCertIssuer(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Issued Month * (YYYY-MM)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-01"
                    pattern="\d{4}-(0[1-9]|1[0-2])"
                    value={newCertIssuedMonth}
                    onChange={(e) => setNewCertIssuedMonth(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Expires Month (YYYY-MM, optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 2029-01"
                    pattern="\d{4}-(0[1-9]|1[0-2])"
                    value={newCertExpiresMonth}
                    onChange={(e) => setNewCertExpiresMonth(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Credential ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS-PSA-12345"
                    value={newCertCredentialId}
                    onChange={(e) => setNewCertCredentialId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Credential URL (https://, optional)</label>
                  <input
                    type="url"
                    placeholder="https://credly.com/..."
                    value={newCertCredentialUrl}
                    onChange={(e) => setNewCertCredentialUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCertificationModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          8. ADD EXPERIENCE MODAL
         ============================================================== */}
      {showAddExperienceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Work Experience</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record past employment or high-scale freelance contracts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExperienceModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExperienceSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Role / Position Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={newExpRole}
                  onChange={(e) => setNewExpRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Company / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Tech Solutions"
                  value={newExpCompany}
                  onChange={(e) => setNewExpCompany(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Remote / San Francisco, CA"
                  value={newExpLocation}
                  onChange={(e) => setNewExpLocation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Month * (YYYY-MM)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024-01"
                    pattern="\d{4}-(0[1-9]|1[0-2])"
                    value={newExpStartMonth}
                    onChange={(e) => setNewExpStartMonth(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Month (YYYY-MM)</label>
                  <input
                    type="text"
                    disabled={newExpIsCurrent}
                    placeholder="e.g. 2025-12"
                    pattern="\d{4}-(0[1-9]|1[0-2])"
                    value={newExpIsCurrent ? "" : newExpEndMonth}
                    onChange={(e) => setNewExpEndMonth(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 ${newExpIsCurrent ? "bg-slate-100 cursor-not-allowed text-slate-400" : "bg-slate-50/70"}`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newExpIsCurrentCheck"
                  checked={newExpIsCurrent}
                  onChange={(e) => {
                    setNewExpIsCurrent(e.target.checked);
                    if (e.target.checked) setNewExpEndMonth("");
                  }}
                  className="w-4 h-4 text-[#4f46e5] rounded border-slate-300"
                />
                <label htmlFor="newExpIsCurrentCheck" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  I currently work in this role
                </label>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Key Achievements / Description</label>
                <textarea
                  rows={4}
                  placeholder="Built scalable backend services...&#10;Led frontend architecture refactor...&#10;Optimized queries and reduced latency by 40%..."
                  value={newExpBullets}
                  onChange={(e) => setNewExpBullets(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExperienceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
