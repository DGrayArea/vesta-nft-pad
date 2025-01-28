import { EmailSubType } from "./sendgrid";

/**
 * render html email templates by providing types
 * @param title
 * @param description
 * @param emailType
 * @param link
 * @returns
 */
export const renderTemplate = (
  title: string,
  description: string,
  emailType: EmailSubType,
  link?: string
) => {
  const template = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .title {
                  font-size: 24px;
                  font-weight: bold;
                  margin-bottom: 20px;
              }
              .description {
                  font-size: 16px;
                  color: #333333;
              }
              .button-container {
                  margin-top: 20px;
              }
              .button {
                  display: inline-block;
                  padding: 10px 20px;
                  font-size: 16px;
                  color: #fff;
                  background-color: #05F691;
                  text-decoration: none;
                  border-radius: 5px;
                  transition: background-color 0.3s ease;
              }
              .button:hover {
                  background-color: #0056b3;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="title" style="color: {{ titleColor }};">
                  {{ title }}
              </div>
              <div class="description">
                  {{ description }}
              </div>
              {{ button }}
          </div>
      </body>
      </html>
    `;

  const titleColor =
    emailType === "REJECTED"
      ? "red"
      : emailType === "APPROVED"
      ? "green"
      : emailType === "PENDING"
      ? "yellow"
      : "black";

  const button = link
    ? `<div class="button-container">
         <a href="${link}" class="button" target="_blank" rel="noopener noreferrer">
           Click Here
         </a>
       </div>`
    : "";

  const emailHtml = template
    .replace("{{ title }}", title)
    .replace("{{ description }}", description)
    .replace("{{ titleColor }}", titleColor)
    .replace("{{ button }}", button);

  return emailHtml;
};
