const { PDFParse } = require("pdf-parse");

const extractTextFromFile = async (file) => {
  if (!file) {
    throw new Error("No file uploaded");
  }

  if (file.mimetype === "application/pdf") {
    const parser = new PDFParse({ data: file.buffer });

    try {
      const parsed = await parser.getText();
      return parsed.text || "";
    } finally {
      await parser.destroy();
    }
  }

  return file.buffer.toString("utf-8");
};

module.exports = extractTextFromFile;
