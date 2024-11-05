import { useEffect, useState } from "react";
import type {
  SignatoryFactory,
  SignatoryFactoryConfig,
} from "./SignatoryTypes";
import { createBurnerSignatoryFactory } from "./burnerSignatoryFactory";
import { createInjectedProviderSignatoryFactory } from "./injectedProviderSignatoryFactory";
import { createWeb3AuthSignatoryFactory } from "./web3AuthSignatoryFactory";

export type SignatoryFactoryName =
	| "web3AuthSignatoryFactory"
	| "burnerSignatoryFactory"
	| "injectedProviderSignatoryFactory";

export const useSelectedSignatory = (config: SignatoryFactoryConfig) => {
	const [configuredFactoriesByName, setConfiguredFactoriesByName] =
		useState<{
			[K in SignatoryFactoryName]: SignatoryFactory;
		}>();

	const [selectedSignatoryName, setSelectedSignatoryName] =
		useState<SignatoryFactoryName>("burnerSignatoryFactory");

	useEffect(() => {
		const factoriesByName = {
			web3AuthSignatoryFactory: createWeb3AuthSignatoryFactory(config),
			burnerSignatoryFactory: createBurnerSignatoryFactory(config),
			injectedProviderSignatoryFactory:
				createInjectedProviderSignatoryFactory(config),
		};
		setConfiguredFactoriesByName(factoriesByName);
	}, []);

	const selectedSignatory =
		configuredFactoriesByName &&
		configuredFactoriesByName[selectedSignatoryName];

	return {
		selectedSignatory,
		setSelectedSignatoryName,
		selectedSignatoryName,
	};
};
