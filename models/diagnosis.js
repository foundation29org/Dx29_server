// Diagnosis Schema
'use strict'

const mongoose = require ('mongoose');
const Schema = mongoose.Schema
const Patient = require('./patient')

const { conndbdata } = require('../db_connect')

const DiagnosisSchema = Schema({
	hasDiagnosis: {type: Boolean},
	previousDiagnosis: {type: String, default: null},
	identifiedGene: {type: String, default: null},
	geneticTests: {type: Object, default: []},
	geneticallyTested: {type: String, default: ''},
	haveGeneticData: {type: String, default: ''},
	evaluation: String,
	notes: {type: String, default: ''},
	infoGenesAndConditionsExomizer: {type: Object, default: []},
	infoGenesAndConditionsPhen2Genes: {type: Object, default: []},
	relatedConditions: {type: Object, default: []},
	hasVcf: {type: Boolean, default: false},
	selectedItemsFilter: {type: Object, default: []},
	settingExomizer: {type: Object, default: {
        "IsGenome": false,
        "VcfBlobName": '',
        "PedBlobName": null,
        "Proband": null,
        "CaseName": null,
        "NumGenes" : 0,
        "Hpos": [],
        "HiPhivePrioritisers": ["human", "mouse", "fish", "ppi"],
        "PathogenicitySources" : [ "POLYPHEN", "MUTATION_TASTER", "SIFT"] ,
        "AnalysisMode": "PASS_ONLY",
        "Frequency": 1.0,
        "KeepNonPathogenic":  true,
        "RegulatoryFeatureFilter": false,
        "MinQuality": 20.0,
        "OutputPassVariantsOnly": false,
        "OutputFormats": ["HTML", "JSON"],
        "InheritanceModes": {
           "AUTOSOMAL_DOMINANT": 0.1,
           "AUTOSOMAL_RECESSIVE_HOM_ALT": 0.1,
           "AUTOSOMAL_RECESSIVE_COMP_HET": 2.0,
           "X_DOMINANT": 0.1,
           "X_RECESSIVE_HOM_ALT": 0.1,
           "X_RECESSIVE_COMP_HET": 2.0,
           "MITOCHONDRIAL": 0.2
        },
        "FrequencySources": ["THOUSAND_GENOMES", "TOPMED", "UK10K", "ESP_AFRICAN_AMERICAN", "ESP_EUROPEAN_AMERICAN", "ESP_ALL", "EXAC_AFRICAN_INC_AFRICAN_AMERICAN", "EXAC_AMERICAN", "EXAC_SOUTH_ASIAN", "EXAC_EAST_ASIAN", "EXAC_FINNISH", "EXAC_NON_FINNISH_EUROPEAN", "EXAC_OTHER", "GNOMAD_E_AFR", "GNOMAD_E_AMR", "GNOMAD_E_EAS", "GNOMAD_E_FIN", "GNOMAD_E_NFE",
        "GNOMAD_E_OTH", "GNOMAD_E_SAS", "GNOMAD_G_AFR", "GNOMAD_G_AMR", "GNOMAD_G_EAS", "GNOMAD_G_FIN", "GNOMAD_G_NFE", "GNOMAD_G_OTH", "GNOMAD_G_SAS"],
        "VariantEffectFilters": {"remove": ["UPSTREAM_GENE_VARIANT", "INTERGENIC_VARIANT", "REGULATORY_REGION_VARIANT", "CODING_TRANSCRIPT_INTRON_VARIANT", "NON_CODING_TRANSCRIPT_INTRON_VARIANT", "SYNONYMOUS_VARIANT", "DOWNSTREAM_GENE_VARIANT", "SPLICE_REGION_VARIANT"]},
        "genomeAssembly": 'hg19'
      }},
	date: {type: Date, default: Date.now},
	createdBy: { type: Schema.Types.ObjectId, ref: "Patient"}
})

module.exports = conndbdata.model('Diagnosis',DiagnosisSchema)
// we need to export the model so that it is accessible in the rest of the app
