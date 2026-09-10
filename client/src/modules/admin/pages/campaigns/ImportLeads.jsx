import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Steps, Button, Upload, Select, Table, Alert, Spin, message, Tag } from "antd";
import { ArrowLeft, UploadCloud, CheckCircle2 } from "lucide-react";
import api from "@/services/api";

// Must match server/controllers/csvImportController.js VALID_SYSTEM_FIELDS.
// 'budget' is a single column mapped to BOTH minBudget and maxBudget.
const SYSTEM_FIELDS = [
  { value: "", label: "-- Skip this column --" },
  { value: "fullName", label: "Full Name" },
  { value: "phoneNumber", label: "Phone Number" },
  { value: "email", label: "Email" },
  { value: "preferredLocation", label: "Preferred Area" },
  { value: "budget", label: "Budget (single value)" },
  { value: "minBudget", label: "Min Budget" },
  { value: "maxBudget", label: "Max Budget" },
  { value: "propertyType", label: "Property Type" },
  { value: "usageType", label: "Usage Type" },
  { value: "message", label: "Message" },
];

// Best-effort auto-match of a CSV header to a system field, so the mapping
// step starts pre-filled rather than fully blank.
const AUTO_MATCH = {
  full_name: "fullName",
  name: "fullName",
  phone_number: "phoneNumber",
  phone: "phoneNumber",
  mobile: "phoneNumber",
  email: "email",
  preferred_area: "preferredLocation",
  area: "preferredLocation",
  location: "preferredLocation",
  budget: "budget",
  min_budget: "minBudget",
  max_budget: "maxBudget",
  property_type: "propertyType",
  usage_type: "usageType",
  message: "message",
  notes: "message",
};

const guessField = (header) => {
  const key = header.trim().toLowerCase().replace(/\s+/g, "_");
  return AUTO_MATCH[key] || "";
};

// Parses only the header row + a couple of preview rows client-side, purely
// for the mapping UI — the authoritative parse/validate happens server-side
// in both dryRun and the real commit.
const parseCsvPreview = (text) => {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], sampleRows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const sampleRows = lines.slice(1, 4).map((line) => line.split(",").map((c) => c.trim()));
  return { headers, sampleRows };
};

const STEP_TITLES = ["Upload", "Map Columns", "Preview", "Done"];

const ImportLeads = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loadingCampaign, setLoadingCampaign] = useState(true);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);
  const [mapping, setMapping] = useState({}); // { csvHeader: systemField }

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);

  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const loadCampaign = useCallback(async () => {
    setLoadingCampaign(true);
    try {
      const res = await api.get(`/admin/campaigns/${id}`);
      setCampaign(res.data?.campaign || null);
    } catch (error) {
      console.error("Failed to load campaign:", error);
      message.error("Failed to load campaign");
    } finally {
      setLoadingCampaign(false);
    }
  }, [id]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const remaining =
    campaign && campaign.committedMinimum != null
      ? Math.max(campaign.committedMinimum - (campaign.deliveredCount || 0), 0)
      : null;

  const handleFileSelect = (selectedFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers: parsedHeaders, sampleRows: parsedSamples } = parseCsvPreview(String(e.target.result));
      if (parsedHeaders.length === 0) {
        message.error("Could not read any columns from this file");
        return;
      }
      const initialMapping = {};
      parsedHeaders.forEach((h) => {
        initialMapping[h] = guessField(h);
      });
      setFile(selectedFile);
      setHeaders(parsedHeaders);
      setSampleRows(parsedSamples);
      setMapping(initialMapping);
      setStep(1);
    };
    reader.readAsText(selectedFile);
    return false; // prevent antd Upload's own auto-upload
  };

  const columnMappingPayload = useMemo(() => {
    const cleaned = {};
    Object.entries(mapping).forEach(([header, field]) => {
      if (field) cleaned[header] = field;
    });
    return cleaned;
  }, [mapping]);

  const hasRequiredFields = useMemo(() => {
    const mappedFields = new Set(Object.values(mapping).filter(Boolean));
    return mappedFields.has("fullName") && mappedFields.has("phoneNumber");
  }, [mapping]);

  const runImport = async (dryRun) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("columnMapping", JSON.stringify(columnMappingPayload));
    if (dryRun) formData.append("dryRun", "true");

    return api.post(`/admin/campaigns/${id}/import-leads`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setPreviewResult(null);
    try {
      const res = await runImport(true);
      setPreviewResult(res.data);
      setStep(2);
    } catch (error) {
      message.error(error.response?.data?.message || "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setImportLoading(true);
    try {
      const res = await runImport(false);
      setImportResult(res.data);
      setStep(3);
      message.success("Leads imported");
    } catch (error) {
      message.error(error.response?.data?.message || "Import failed");
    } finally {
      setImportLoading(false);
    }
  };

  const resetWizard = () => {
    setStep(0);
    setFile(null);
    setHeaders([]);
    setSampleRows([]);
    setMapping({});
    setPreviewResult(null);
    setImportResult(null);
  };

  const mappingColumns = [
    { title: "CSV Column", dataIndex: "header", key: "header" },
    {
      title: "Sample Value",
      dataIndex: "sample",
      key: "sample",
      render: (v) => <span className="text-gray-400">{v || "—"}</span>,
    },
    {
      title: "Maps To",
      dataIndex: "header",
      key: "mapTo",
      render: (header) => (
        <Select
          className="w-56"
          value={mapping[header] || ""}
          onChange={(value) => setMapping((prev) => ({ ...prev, [header]: value }))}
          options={SYSTEM_FIELDS}
        />
      ),
    },
  ];

  const mappingDataSource = headers.map((h, idx) => ({
    key: h,
    header: h,
    sample: sampleRows[0]?.[idx] || "",
  }));

  if (loadingCampaign) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-6 text-center text-gray-500">Campaign not found.</div>;
  }

  if (campaign.status !== "active") {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => navigate(`/admin/campaigns/${id}`)} className="mb-4">
          Back to Campaign
        </Button>
        <Alert
          type="warning"
          showIcon
          message="Campaign is not active"
          description={`Leads can only be imported into an active campaign (currently '${campaign.status}').`}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => navigate(`/admin/campaigns/${id}`)} className="mb-4">
        Back to Campaign
      </Button>

      <Card className="rounded-xl mb-6">
        <h1 className="text-lg font-bold text-gray-900 m-0">Import Leads — {campaign.projectTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Delivered {campaign.deliveredCount} / {campaign.committedMinimum}
          {remaining !== null && <span className="ml-2">({remaining} remaining to commitment)</span>}
        </p>
      </Card>

      <Card className="rounded-xl">
        <Steps current={step} items={STEP_TITLES.map((title) => ({ title }))} className="mb-6" />

        {step === 0 && (
          <div className="text-center py-10">
            <Upload.Dragger
              accept=".csv"
              showUploadList={false}
              beforeUpload={handleFileSelect}
              multiple={false}
            >
              <p className="ant-upload-drag-icon flex justify-center">
                <UploadCloud size={40} className="text-blue-500" />
              </p>
              <p className="ant-upload-text">Click or drag a CSV file to this area</p>
              <p className="ant-upload-hint text-gray-400">Max 5MB, .csv only</p>
            </Upload.Dragger>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Map each column from <b>{file?.name}</b> to a lead field. Full Name and Phone Number are required.
            </p>
            <Table
              dataSource={mappingDataSource}
              columns={mappingColumns}
              pagination={false}
              size="small"
              className="mb-4"
            />
            {!hasRequiredFields && (
              <Alert
                type="warning"
                showIcon
                className="mb-4"
                message="Map at least one column to Full Name and one to Phone Number to continue"
              />
            )}
            <div className="flex justify-end gap-3">
              <Button onClick={resetWizard}>Cancel</Button>
              <Button type="primary" disabled={!hasRequiredFields} loading={previewLoading} onClick={handlePreview}>
                Preview Import
              </Button>
            </div>
          </div>
        )}

        {step === 2 && previewResult && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600 m-0">{previewResult.imported}</p>
                <p className="text-xs text-gray-500 m-0">Will Import</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-500 m-0">{previewResult.duplicates}</p>
                <p className="text-xs text-gray-500 m-0">Duplicates</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-500 m-0">{previewResult.failed}</p>
                <p className="text-xs text-gray-500 m-0">Failed</p>
              </div>
            </div>

            {previewResult.errorLog?.length > 0 && (
              <Alert
                type="error"
                showIcon
                className="mb-4"
                message={`${previewResult.errorLog.length} row(s) will be skipped`}
                description={
                  <ul className="m-0 pl-4 max-h-32 overflow-y-auto">
                    {previewResult.errorLog.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                }
              />
            )}

            {previewResult.imported === 0 && (
              <Alert type="warning" showIcon className="mb-4" message="No rows will be imported — check your mapping" />
            )}

            <div className="flex justify-end gap-3">
              <Button onClick={() => setStep(1)}>Back to Mapping</Button>
              <Button
                type="primary"
                disabled={previewResult.imported === 0}
                loading={importLoading}
                onClick={handleConfirmImport}
              >
                Confirm Import ({previewResult.imported} leads)
              </Button>
            </div>
          </div>
        )}

        {step === 3 && importResult && (
          <div className="text-center py-8">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900">Import Complete</h2>
            <p className="text-sm text-gray-500 mb-4">
              {importResult.imported} lead(s) imported, {importResult.duplicates} duplicate(s), {importResult.failed}{" "}
              failed
            </p>
            <Tag color="blue" className="text-sm px-3 py-1 mb-6">
              Campaign now at {importResult.campaignDelivered} / {importResult.campaignCommitted}
            </Tag>
            <div className="flex justify-center gap-3">
              <Button onClick={resetWizard}>Import Another File</Button>
              <Button type="primary" onClick={() => navigate(`/admin/campaigns/${id}`)}>
                Back to Campaign
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ImportLeads;
