export interface CreateAuditParams {
  url: string;
  businessName?: string;
  location?: string;
  maxPages?: number;
}

export interface AuditStreamMessage {
  type: 'status' | 'progress' | 'page_crawled' | 'evidence_added' | 'complete' | 'error';
  auditId: string;
  status: string;
  progressPercent: number;
  message: string;
  data?: any;
}

export const API = {
  async startAudit(params: CreateAuditParams): Promise<{ auditId: string; status: string; streamUrl: string }> {
    const res = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.reason || errorData.error || errorData.message || 'Failed to initiate audit');
    }

    return await res.json();
  },

  async getAudit(auditId: string): Promise<any> {
    const res = await fetch(`/api/audit/${auditId}`);
    if (!res.ok) {
      throw new Error('Audit report not found');
    }
    return await res.json();
  },

  async cancelAudit(auditId: string): Promise<void> {
    await fetch(`/api/audit/${auditId}/cancel`, { method: 'POST' });
  },

  async listAudits(): Promise<any[]> {
    const res = await fetch('/api/audits');
    if (!res.ok) return [];
    return await res.json();
  },

  async deleteAudit(auditId: string): Promise<void> {
    await fetch(`/api/audit/${auditId}`, { method: 'DELETE' });
  },

  async getSalesReport(auditId: string): Promise<any> {
    const res = await fetch(`/api/audit/${auditId}/sales-report`);
    if (!res.ok) {
      throw new Error('Sales report not found');
    }
    return await res.json();
  },

  subscribeToAuditStream(
    auditId: string,
    onMessage: (msg: AuditStreamMessage) => void,
    onError?: (err: any) => void
  ): () => void {
    const eventSource = new EventSource(`/api/audit/${auditId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const parsed: AuditStreamMessage = JSON.parse(event.data);
        onMessage(parsed);
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    eventSource.onerror = (err) => {
      if (onError) onError(err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  },
};
