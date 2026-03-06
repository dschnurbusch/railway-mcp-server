import type { ToolDefinition } from "../../types.js";

const ENDPOINT = "https://app.docupost.com/api/1.1/wf/sendletter";

const tool: ToolDefinition = {
  name: "send_mailing",
  category: "docupost",
  description:
    "Send a physical letter via USPS through DocuPost. Provide either a PDF URL or HTML content. Sender address is pre-configured via environment variables.",
  tags: ["docupost", "mail", "letter", "usps", "physical", "certified"],
  schema: {
    type: "object",
    properties: {
      recipient_name: {
        type: "string",
        description: "Full name of the recipient (max 40 characters)",
      },
      recipient_company: {
        type: "string",
        description: "Company name of the recipient (optional)",
      },
      address_line1: { type: "string", description: "Street address line 1" },
      address_line2: { type: "string", description: "Street address line 2 (optional)" },
      address_city: { type: "string", description: "City" },
      address_state: { type: "string", description: "Two-letter state abbreviation (e.g. CA)" },
      address_zipcode: { type: "string", description: "5-digit ZIP code" },
      pdf_url: {
        type: "string",
        description: "URL of the PDF to mail. Required unless providing html_content.",
      },
      html_content: {
        type: "string",
        description:
          "Raw HTML letter content (max 9,000 chars). Use instead of pdf_url if no PDF is available.",
      },
      mail_class: {
        type: "string",
        description:
          "USPS mail class. Default: usps_first_class. Options: usps_first_class, usps_standard, usps_priority_mail, usps_priority_mail_express",
      },
      service_level: {
        type: "string",
        description:
          "Upgrade service level (first class only). Options: none, certified, certified_return_receipt. Default: none",
      },
      include_return_envelope: {
        type: "boolean",
        description: "Include a return-addressed envelope. Default: false",
      },
      include_prepaid_return_envelope: {
        type: "boolean",
        description: "Include a prepaid return envelope. Default: false",
      },
      description: {
        type: "string",
        description: "Internal description/note (max 40 characters)",
      },
    },
    required: [
      "recipient_name",
      "address_line1",
      "address_city",
      "address_state",
      "address_zipcode",
    ],
  },
  async execute(params) {
    const {
      recipient_name,
      recipient_company,
      address_line1,
      address_line2,
      address_city,
      address_state,
      address_zipcode,
      pdf_url,
      html_content,
      mail_class = "usps_first_class",
      service_level = "none",
      include_return_envelope = false,
      include_prepaid_return_envelope = false,
      description,
    } = params as Record<string, any>;

    if (!pdf_url && !html_content) {
      throw new Error("Either pdf_url or html_content is required.");
    }

    const apiToken = process.env.DOCUPOST_API_TOKEN!;
    const url = `${ENDPOINT}?api_token=${encodeURIComponent(apiToken)}`;

    const body = new URLSearchParams({
      to_name: recipient_name,
      to_address1: address_line1,
      to_city: address_city,
      to_state: address_state,
      to_zip: address_zipcode,
      from_name: process.env.DOCUPOST_FROM_NAME!,
      from_address1: process.env.DOCUPOST_FROM_ADDRESS1!,
      from_city: process.env.DOCUPOST_FROM_CITY!,
      from_state: process.env.DOCUPOST_FROM_STATE!,
      from_zip: process.env.DOCUPOST_FROM_ZIP!,
      class: mail_class,
      servicelevel: service_level,
      return_envelope: String(include_return_envelope),
      prepaid_return_envelope: String(include_prepaid_return_envelope),
      color: "false",
      doublesided: "true",
    });

    if (recipient_company) body.set("to_company", recipient_company);
    if (address_line2) body.set("to_address2", address_line2);
    if (pdf_url) body.set("pdf", pdf_url);
    if (html_content) body.set("html", html_content);
    if (description) body.set("description", String(description).slice(0, 40));
    if (process.env.DOCUPOST_FROM_ADDRESS2) {
      body.set("from_address2", process.env.DOCUPOST_FROM_ADDRESS2);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(`DocuPost error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as Record<string, unknown>;

    return {
      success: true,
      recipient: recipient_name,
      mail_class,
      service_level,
      response: data,
    };
  },
};

export default tool;
