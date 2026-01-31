import { headers } from 'next/headers';

interface VaultSecretResponse {
  data: {
    data: Record<string, string>;
    metadata: unknown;
  };
}

/**
 * Fetches secrets from your HashiCorp Vault.
 * Assumes KV Version 2.
 */
export async function getVaultSecret(secretPath: string): Promise<Record<string, string>> {
  const vaultAddr = process.env.VAULT_ADDR || 'https://s.didiberman.com:8200';
  const vaultToken = process.env.VAULT_TOKEN; // In Prod, use AppRole or Kubernetes Auth

  if (!vaultToken) {
    console.warn('VAULT_TOKEN not found, skipping Vault fetch (Dev mode?)');
    return {};
  }

  // Ensure path doesn't have leading slash for the API call if strictly appending
  // But Vault API usually needs `v1/secret/data/my-secret`
  // We'll assume secretPath is just the name, e.g., "video-saas"
  // Adjust mount point "secret" as needed.
  const mountPoint = 'secret'; 
  const url = `${vaultAddr}/v1/${mountPoint}/data/${secretPath}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Vault-Token': vaultToken,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh secrets
    });

    if (!res.ok) {
      throw new Error(`Vault Error: ${res.statusText} (${res.status})`);
    }

    const json: VaultSecretResponse = await res.json();
    return json.data.data;
  } catch (error) {
    console.error('Failed to fetch from Vault:', error);
    throw error;
  }
}
