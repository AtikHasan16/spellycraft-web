const GOOGLE_DRIVE_HOSTS = new Set(["drive.google.com", "docs.google.com"]);
const DRIVE_FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/;

export function parseGoogleDriveLink(value) {
  let url;

  try {
    url = new URL(String(value || "").trim());
  } catch {
    return null;
  }

  if (
    url.protocol !== "https:" ||
    !GOOGLE_DRIVE_HOSTS.has(url.hostname.toLowerCase()) ||
    url.port ||
    url.username ||
    url.password
  ) {
    return null;
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  const idIndex = pathParts.findIndex((part) => part === "d");
  const pathId = idIndex >= 0 ? pathParts[idIndex + 1] : null;
  const fileId = pathId || url.searchParams.get("id");

  if (!fileId || !DRIVE_FILE_ID_PATTERN.test(fileId)) {
    return null;
  }

  return {
    href: url.href,
    fileId,
    previewUrl: url.href,
  };
}

export function isGoogleDriveLink(value) {
  return parseGoogleDriveLink(value) !== null;
}
