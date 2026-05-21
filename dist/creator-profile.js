// creator-profile.jsx — local creator profiles, likes, and trending helpers

var CREATOR_PROFILE_STORAGE_KEY = 'immm.v2.creatorProfiles';
var DEFAULT_CREATOR_PROFILE = {
  id: 'immm-studio',
  name: 'IMMM Studio',
  bio: 'House frames and experiments from the IMMM team.',
  avatarColor: '#1A1A1F',
  instagram: '',
  website: '',
  verified: true,
  socialLinks: [],
  packsCreated: 0,
  likes: 0
};
var DEFAULT_LOCAL_CREATOR_PROFILE = {
  id: 'you',
  name: 'You',
  bio: 'Your saved frames and experiments.',
  avatarColor: '#D98893',
  instagram: '',
  website: '',
  verified: false,
  socialLinks: [],
  packsCreated: 0,
  likes: 0
};
function clampScoreInput(value, fallback = 0) {
  var num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
function createCreatorProfile(partial = {}) {
  return normalizeCreatorProfile(partial);
}
function normalizeCreatorProfile(profile) {
  var source = profile && typeof profile === 'object' ? profile : {};
  var socialLinks = Array.isArray(source.socialLinks) ? source.socialLinks.map(item => ({
    label: String(item?.label || '').trim(),
    url: String(item?.url || '').trim()
  })).filter(item => item.label || item.url) : [];
  return {
    id: String(source.id || DEFAULT_LOCAL_CREATOR_PROFILE.id),
    name: String(source.name || DEFAULT_LOCAL_CREATOR_PROFILE.name),
    bio: String(source.bio || ''),
    avatarColor: String(source.avatarColor || DEFAULT_LOCAL_CREATOR_PROFILE.avatarColor),
    instagram: String(source.instagram || ''),
    website: String(source.website || ''),
    verified: Boolean(source.verified),
    socialLinks,
    packsCreated: Math.max(0, Math.floor(clampScoreInput(source.packsCreated, 0))),
    likes: Math.max(0, Math.floor(clampScoreInput(source.likes, 0)))
  };
}
function loadCreatorProfiles() {
  try {
    var raw = localStorage.getItem(CREATOR_PROFILE_STORAGE_KEY);
    if (!raw) return [DEFAULT_CREATOR_PROFILE, DEFAULT_LOCAL_CREATOR_PROFILE];
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [DEFAULT_CREATOR_PROFILE, DEFAULT_LOCAL_CREATOR_PROFILE];
    var normalized = parsed.map(profile => normalizeCreatorProfile(profile)).filter(Boolean);
    return normalized.length ? normalized : [DEFAULT_CREATOR_PROFILE, DEFAULT_LOCAL_CREATOR_PROFILE];
  } catch (_) {
    return [DEFAULT_CREATOR_PROFILE, DEFAULT_LOCAL_CREATOR_PROFILE];
  }
}
function saveCreatorProfiles(profiles) {
  var safe = Array.isArray(profiles) ? profiles.map(profile => normalizeCreatorProfile(profile)).filter(Boolean) : [DEFAULT_CREATOR_PROFILE, DEFAULT_LOCAL_CREATOR_PROFILE];
  localStorage.setItem(CREATOR_PROFILE_STORAGE_KEY, JSON.stringify(safe));
  return safe;
}
function upsertCreatorProfile(profile) {
  var normalized = normalizeCreatorProfile(profile);
  var next = loadCreatorProfiles().filter(item => item.id !== normalized.id);
  next.push(normalized);
  return saveCreatorProfiles(next);
}
function getCreatorProfileById(id, profiles = null) {
  if (!id) return null;
  var current = Array.isArray(profiles) ? profiles : loadCreatorProfiles();
  return current.find(profile => profile.id === id) || null;
}
function getCreatorDisplayName(profile) {
  return normalizeCreatorProfile(profile).name || 'Imported';
}
function getTrendingScore({
  likes = 0,
  uses = 0,
  createdAt = null,
  updatedAt = null
} = {}) {
  var likeScore = Math.max(0, Number(likes) || 0) * 3;
  var useScore = Math.max(0, Number(uses) || 0) * 2;
  var refTime = updatedAt || createdAt || null;
  var recentBoost = refTime ? Math.max(0, 30 - Math.min(30, Math.floor((Date.now() - new Date(refTime).getTime()) / 86400000))) : 0;
  return likeScore + useScore + recentBoost;
}
function buildCreatorSharePayload({
  framePresetId = '',
  packId = '',
  creatorId = ''
} = {}) {
  return {
    framePresetId: String(framePresetId || ''),
    packId: String(packId || ''),
    creatorId: String(creatorId || '')
  };
}
var IMMMCreatorProfiles = {
  CREATOR_PROFILE_STORAGE_KEY,
  DEFAULT_CREATOR_PROFILE,
  DEFAULT_LOCAL_CREATOR_PROFILE,
  createCreatorProfile,
  normalizeCreatorProfile,
  loadCreatorProfiles,
  saveCreatorProfiles,
  upsertCreatorProfile,
  getCreatorProfileById,
  getCreatorDisplayName,
  getTrendingScore,
  buildCreatorSharePayload
};
if (typeof window !== 'undefined') {
  window.IMMMCreatorProfiles = IMMMCreatorProfiles;
  Object.assign(window, IMMMCreatorProfiles);
}