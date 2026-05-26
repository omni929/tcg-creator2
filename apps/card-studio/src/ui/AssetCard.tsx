import { type ReactElement } from "react";

export function AssetCard({
  label,
  hint,
  fileName,
  onUpload,
  onClear
}: {
  label: string;
  hint: string;
  fileName?: string;
  onUpload: (file: File | undefined) => void;
  onClear?: () => void;
}): ReactElement {
  return (
    <div className="asset-card">
      <div className="asset-copy">
        <strong>{label}</strong>
        <p>{fileName ?? hint}</p>
      </div>
      <div className="asset-actions">
        <label className="upload-button">
          Upload
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => onUpload(event.target.files?.[0])}
          />
        </label>
        {onClear ? (
          <button className="ghost-button" type="button" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
