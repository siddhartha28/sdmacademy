"use client";

import { useState, useRef } from "react";
import { Upload, Download, CheckCircle, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
      setPreview(rows.slice(0, 5));
    };
    reader.readAsBinaryString(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const data = ev.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

        const res = await fetch("/api/bulk-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ students: rows }),
        });

        const resultData: ImportResult = await res.json();
        setResult(resultData);
        if (resultData.created > 0) {
          toast.success(`${resultData.created} students imported successfully`);
        }
        if (resultData.errors.length > 0) {
          toast.error(`${resultData.skipped} rows skipped`);
        }
        setImporting(false);
      };
      reader.readAsBinaryString(file);
    } catch {
      toast.error("Import failed");
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [["name", "rollNo", "class", "section", "gender", "fatherName", "motherName", "phone", "admissionNo", "admissionYear"]];
    const sample = [["Rahul Kumar", "01", "Class 1", "A", "Male", "Rajesh Kumar", "Priya Kumar", "9876543210", "ADM-2024-001", "2024"]];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_import_template.xlsx");
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Bulk Student Import</h1>
        <p className="text-sm text-gray-500">Upload an Excel or CSV file to add multiple students at once</p>
      </div>

      <Card className="mb-6">
        <CardHeader title="Download Template" subtitle="Use this template to format your data correctly" />
        <CardBody>
          <p className="text-sm text-gray-500 mb-4">
            The Excel template includes all required columns. Fill in the data and upload below.
            Make sure class names match exactly (e.g., &quot;Class 1&quot;, &quot;Class 2&quot;, &quot;Play&quot;, &quot;Nursery&quot;).
          </p>
          <Button variant="secondary" onClick={downloadTemplate}>
            <Download size={15} /> Download Template
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Upload File" />
        <CardBody>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-600">{file ? file.name : "Click to upload Excel or CSV file"}</p>
            <p className="text-sm text-gray-400 mt-1">.xlsx, .xls, .csv supported</p>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />

          {preview.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows):</p>
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>{Object.keys(preview[0]).map(k => <th key={k} className="px-3 py-2 text-left text-gray-500">{k}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      {Object.values(row).map((v, j) => <td key={j} className="px-3 py-2 text-gray-700">{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {file && (
            <div className="mt-4">
              <Button onClick={handleImport} loading={importing} className="w-full">
                <Upload size={15} /> Import Students
              </Button>
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">{result.created} students imported successfully</span>
              </div>
              {result.skipped > 0 && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">{result.skipped} rows skipped</span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                  {result.errors.map((err, i) => <p key={i} className="text-xs text-red-500">{err}</p>)}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
