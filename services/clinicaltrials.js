'use strict'

const { jsonRequest } = require('./httpClient')

function toList (value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function mapStatus (status) {
  if (!status) return status
  const normalized = String(status).toUpperCase()
  if (normalized === 'RECRUITING') return 'Recruiting'
  if (normalized === 'AVAILABLE') return 'Available'
  return status
}

function mapStudy (study) {
  const protocol = study.protocolSection || {}
  const identification = protocol.identificationModule || {}
  const status = protocol.statusModule || {}
  const sponsor = protocol.sponsorCollaboratorsModule || {}
  const contacts = protocol.contactsLocationsModule || {}
  const organization = identification.organization || {}
  const responsibleParty = sponsor.responsibleParty || {}

  return {
    Study: {
      ProtocolSection: {
        IdentificationModule: {
          NCTId: identification.nctId,
          BriefTitle: identification.briefTitle,
          Organization: {
            OrgFullName: organization.fullName
          }
        },
        StatusModule: {
          OverallStatus: mapStatus(status.overallStatus),
          StudyFirstSubmitDate: status.studyFirstSubmitDate
        },
        SponsorCollaboratorsModule: {
          ResponsibleParty: {
            ResponsiblePartyInvestigatorFullName: responsibleParty.investigatorFullName
          }
        },
        ContactsLocationsModule: {
          LocationList: {
            Location: toList(contacts.locations).map((location) => ({
              LocationCountry: location.country
            }))
          },
          CentralContactList: {
            CentralContact: toList(contacts.centralContacts).map((contact) => ({
              CentralContactName: contact.name,
              CentralContactEMail: contact.email
            }))
          }
        }
      }
    }
  }
}

function searchClinicalTrials (req, res) {
  const name = typeof req.query.name === 'string' ? req.query.name.trim() : ''
  if (!name) {
    return res.status(400).send({ message: 'Missing disease name' })
  }

  const url = 'https://clinicaltrials.gov/api/v2/studies?' + new URLSearchParams({
    'query.cond': name,
    pageSize: '50',
    format: 'json'
  }).toString()

  jsonRequest({ method: 'GET', url }).then((response) => {
    if (response.statusCode >= 400 || !response.body || !Array.isArray(response.body.studies)) {
      return res.status(response.statusCode || 502).send({
        FullStudiesResponse: { FullStudies: [] }
      })
    }

    res.status(200).send({
      FullStudiesResponse: {
        FullStudies: response.body.studies.map(mapStudy)
      }
    })
  }).catch((error) => {
    console.error(error)
    res.status(502).send({ message: error.message || error })
  })
}

module.exports = {
  searchClinicalTrials
}
