import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVolunteerSignature,
  buildVolunteerTemplateBody,
  buildWhatsAppLink,
  composeVolunteerMessage,
  getVolunteerTrack,
  isGmailAddress,
  normalizeWhatsAppNumber,
  validateVolunteerApplication,
  withIndefiniteArticle,
} from "../src/utils/volunteerApplication.js";

const validFields = {
  fullName: "Amina Rahman",
  designation: "English Educator",
  gmail: "amina.rahman@gmail.com",
  whatsapp: "+8801712345678",
  country: "Bangladesh",
  track: "linguistics",
  experience: "Six years teaching IELTS grammar and editing curriculum content.",
};

test("Gmail validation accepts only @gmail.com addresses", () => {
  assert.equal(isGmailAddress("amina.rahman@gmail.com"), true);
  assert.equal(isGmailAddress("Amina+Rahman@Gmail.com"), true);
  assert.equal(isGmailAddress("amina@gmail.com.evil.test"), false);
  assert.equal(isGmailAddress("amina@yahoo.com"), false);
  assert.equal(isGmailAddress("amina@gmail.co"), false);
  assert.equal(isGmailAddress("not-an-email"), false);
});

test("WhatsApp numbers normalize to a single leading plus and valid wa.me links", () => {
  assert.equal(normalizeWhatsAppNumber("+880 1712-345678"), "+8801712345678");
  assert.equal(normalizeWhatsAppNumber("(880) 1712 345678"), "+8801712345678");
  assert.equal(normalizeWhatsAppNumber(""), "");
  assert.equal(
    buildWhatsAppLink("+880 1712-345678"),
    "https://wa.me/8801712345678",
  );
  assert.equal(buildWhatsAppLink("123"), "");
});

test("template body and signature include the structured applicant details", () => {
  const body = buildVolunteerTemplateBody(validFields);
  assert.match(body, /Amina Rahman/);
  assert.match(body, /English Educator/);
  assert.match(body, /Bangladesh/);
  assert.match(body, /English Linguistics & Curriculum Development/);
  assert.match(body, /Six years teaching IELTS/);

  const signature = buildVolunteerSignature(validFields);
  assert.equal(
    signature,
    [
      "Best regards,",
      "",
      "Amina Rahman",
      "English Educator",
      "WhatsApp: +8801712345678",
      "Email: amina.rahman@gmail.com",
      "Country: Bangladesh",
    ].join("\n"),
  );

  const composed = composeVolunteerMessage("Custom closing note.", validFields);
  assert.ok(composed.endsWith(signature));
  assert.ok(composed.startsWith("Custom closing note."));
});

test("validation rejects missing fields and non-Gmail domains", () => {
  const errors = validateVolunteerApplication({});
  assert.ok(errors.fullName);
  assert.ok(errors.designation);
  assert.ok(errors.gmail);
  assert.ok(errors.whatsapp);
  assert.ok(errors.country);
  assert.ok(errors.track);
  assert.ok(errors.experience);

  const gmailErrors = validateVolunteerApplication({
    ...validFields,
    gmail: "amina@yahoo.com",
  });
  assert.match(gmailErrors.gmail, /@gmail\.com/);

  const validErrors = validateVolunteerApplication({
    ...validFields,
    messageBody: buildVolunteerTemplateBody(validFields),
  });
  assert.deepEqual(validErrors, {});
});

test("track metadata maps stored values to display labels", () => {
  assert.equal(getVolunteerTrack("software").shortLabel, "Software Dev");
  assert.equal(getVolunteerTrack("linguistics").label, "English Linguistics & Curriculum Development");
  assert.equal(getVolunteerTrack("unknown"), null);
});

test("template prose uses the correct indefinite article for the designation", () => {
  assert.equal(withIndefiniteArticle("English Educator"), "an English Educator");
  assert.equal(withIndefiniteArticle("Student"), "a Student");
  assert.equal(withIndefiniteArticle("University student"), "a University student");
  assert.equal(withIndefiniteArticle("hourly tutor"), "an hourly tutor");
  assert.equal(withIndefiniteArticle("the founder"), "the founder");
  assert.equal(withIndefiniteArticle(""), "a");

  const body = buildVolunteerTemplateBody(validFields);
  assert.match(body, /I am an English Educator based in Bangladesh\./);
});

test("validateVolunteerApplication accepts a pre-composed message from the service layer", () => {
  const errors = validateVolunteerApplication({
    fullName: "Amina Rahman",
    designation: "English Educator",
    gmail: "amina.rahman@gmail.com",
    whatsapp: "+8801712345678",
    country: "Bangladesh",
    track: "linguistics",
    experience: "Six years teaching IELTS grammar and editing curriculum content.",
    message: composeVolunteerMessage("Custom closing note.", validFields),
  });
  assert.deepEqual(errors, {});

  const shortMessage = validateVolunteerApplication({
    ...validFields,
    message: "too short",
  });
  assert.match(shortMessage.messageBody, /short application message/i);
});
