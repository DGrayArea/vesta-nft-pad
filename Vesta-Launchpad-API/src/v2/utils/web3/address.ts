import { getAddress } from '@ethersproject/address';

/**
 * Validates an Ethereum address
 * - Checks if the address is properly formatted
 * - Validates checksum if present
 * - Handles both checksummed and non-checksummed addresses
 * - Returns false for invalid or null addresses
 * 
 * @param address The address to validate
 * @returns boolean indicating if the address is valid
 */
export function validateAddress(address: string | null | undefined): boolean {
    if (!address) {
        return false;
    }

    try {
        // Remove whitespace
        const trimmedAddress = address.trim();

        // Check basic format
        if (!/^0x[0-9a-fA-F]{40}$/.test(trimmedAddress)) {
            return false;
        }

        // Validate and normalize the address using ethers.js
        // This will throw if the address is invalid or if it has an invalid checksum
        getAddress(trimmedAddress);

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Additional utility functions for address handling
 */

/**
 * Normalizes an Ethereum address to checksummed format
 * Returns null if the address is invalid
 */
export function normalizeAddress(address: string): string | null {
    try {
        return getAddress(address);
    } catch {
        return null;
    }
}

/**
 * Compares two addresses for equality (case-insensitive)
 */
export function areAddressesEqual(address1: string, address2: string): boolean {
    try {
        return getAddress(address1) === getAddress(address2);
    } catch {
        return false;
    }
}

/**
 * Checks if an address is a contract address
 * Note: This requires an ethers provider to check the code at the address
 */
export async function isContractAddress(
    address: string,
    provider: any
): Promise<boolean> {
    try {
        const code = await provider.getCode(address);
        return code !== '0x';
    } catch {
        return false;
    }
}

/**
 * Validates multiple addresses at once
 * Returns array of booleans indicating validity of each address
 */
export function validateAddresses(addresses: string[]): boolean[] {
    return addresses.map(validateAddress);
}