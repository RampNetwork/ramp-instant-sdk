import { IPurchase, TPurchaseExternalId } from './types';

export async function doFetchPurchase(
  apiUrl: string,
  purchaseExternalId: TPurchaseExternalId,
  token: string
): Promise<IPurchase | null> {
  try {
    const rawResponse = await fetch(
      `${apiUrl}/host-api/purchase/${purchaseExternalId}?secret=${token}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!rawResponse.ok) {
      throw new Error(`Request for purchase #${purchaseExternalId} failed`);
    }

    const response = await rawResponse.json();

    return response as IPurchase;
  } catch {
    return null;
  }
}

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
