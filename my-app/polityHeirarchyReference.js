export const polityHeirarchy = {
    "polity": {
      "constitution": {
        "introduction": {
          "preamble": {
            "keywords": [
              "Sovereign",
              "Socialist",
              "Secular",
              "Democratic",
              "Republic"
            ],
            "objectives": ["Justice", "Liberty", "Equality", "Fraternity"]
          },
          "parts": 25,
          "articles": 448,
          "schedules": 12
        },
        "partsDetail": {
          "part1": "Union and its Territory",
          "part2": "Citizenship",
          "part3": "Fundamental Rights",
          "part4": "Directive Principles of State Policy",
          "part4A": "Fundamental Duties",
          "part5": "Union Government",
          "part6": "State Government",
          "part7": "Repealed",
          "part8": "Union Territories",
          "part9": "Panchayats",
          "part9A": "Municipalities",
          "part9B": "Co-operative Societies",
          "part10": "Scheduled Areas and Tribes",
          "part11": "Centre-State Relations",
          "part12": "Finance, Property, Contracts",
          "part13": "Trade and Commerce",
          "part14": "Services under Union and States",
          "part14A": "Tribunals",
          "part15": "Elections",
          "part16": "Special Provisions for SC/ST/OBC",
          "part17": "Official Language",
          "part18": "Emergency Provisions",
          "part19": "Miscellaneous",
          "part20": "Amendment of Constitution",
          "part21": "Temporary and Transitional Provisions",
          "part22": "Short Title, Commencement, Repeals"
        }
      },
  
      "unionGovernment": {
        "president": {
          "article": "Article 52-62",
          "election": "Indirect — Electoral College",
          "term": "5 years",
          "powers": {
            "executive": [
              "Appoints PM",
              "Appoints Ministers",
              "Appoints Chief Justice & Judges",
              "Appoints Governors"
            ],
            "legislative": [
              "Summons Parliament",
              "Dissolves Lok Sabha",
              "Nominates members"
            ],
            "judicial": ["Clemency powers under Article 72"],
            "emergency": ["National Emergency", "State Emergency", "Financial Emergency"]
          }
        },
  
        "vicePresident": {
          "article": "Article 63-71",
          "role": "Ex-officio Chairman of Rajya Sabha",
          "election": "Electoral College — MPs only"
        },
  
        "councilOfMinisters": {
          "headedBy": "Prime Minister",
          "responsibility": "Collectively responsible to Lok Sabha",
          "limit": "15% of Lok Sabha strength"
        },
  
        "primeMinister": {
          "appointment": "Appointed by President, usually leader of majority",
          "powers": [
            "Heads Council of Ministers",
            "Leader of Lok Sabha",
            "Advises President",
            "Controls administration"
          ]
        }
      },
  
      "parliament": {
        "lokSabha": {
          "article": "79-122",
          "strength": {
            "maximum": 552,
            "current": 543
          },
          "term": "5 years",
          "speaker": {
            "role": "Presiding officer",
            "powers": [
              "Maintains order",
              "Decides money bills",
              "Controls parliamentary committees"
            ]
          },
          "specialPowers": ["Money bills", "No-confidence motion"]
        },
  
        "rajyaSabha": {
          "strength": {
            "maximum": 250,
            "current": 245
          },
          "permanentBody": true,
          "retirement": "1/3 members retire every 2 years",
  
          "chairman": {
            "exOfficio": "Vice President of India",
            "role": "Presiding officer",
            "powers": [
              "Presides over proceedings",
              "Decides points of order",
              "Can suspend members"
            ]
          },
  
          "deputyChairman": {
            "election": "Elected by Rajya Sabha",
            "role": "Presides in absence of Chairman",
            "removal": "Majority of members present and voting"
          },
  
          "powers": {
            "legislative": [
              "Equal with Lok Sabha except money bills",
              "Participates in constitutional amendments"
            ],
            "financial": ["Can delay money bill for 14 days"],
            "federal": [
              "Can allow Parliament to legislate on State List (Art 249)",
              "Can create All India Services (Art 312)"
            ],
            "judicial": [
              "Participates in impeachment of President",
              "Removal of judges"
            ]
          }
        }
      },
  
      "judiciary": {
        "supremeCourt": {
          "articles": "124-147",
          "established": "1950",
          "composition": {
            "chiefJustice": "CJI",
            "maxJudges": 34
          },
          "jurisdiction": {
            "original": ["Centre-state disputes", "Fundamental rights"],
            "appellate": ["Civil", "Criminal", "SLP (Art 136)"],
            "advisory": ["President's reference (Art 143)"],
            "writs": ["Habeas Corpus", "Mandamus", "Prohibition", "Certiorari", "Quo Warranto"]
          }
        },
  
        "highCourt": {
          "articles": "214-231",
          "jurisdiction": [
            "Original",
            "Appellate",
            "Supervisory",
            "Writ jurisdiction (Art 226)"
          ]
        },
  
        "subordinateCourts": {
          "types": ["District Court", "Sessions Court", "Civil Court", "Criminal Court"],
          "controlledBy": "High Court"
        }
      },
  
      "stateGovernment": {
        "governor": {
          "articles": "153-162",
          "appointment": "By President",
          "term": "5 years",
          "powers": {
            "executive": ["Appoints CM", "Appoints ministers"],
            "legislative": ["Summons Assembly", "Dissolves Assembly"],
            "judicial": ["Pardoning for state offenses"],
            "emergency": ["Can recommend President's Rule"]
          }
        },
  
        "chiefMinister": {
          "appointment": "Appointed by Governor",
          "role": "Real executive authority"
        },
  
        "stateCouncilOfMinisters": {
          "responsibility": "Collectively responsible to Legislative Assembly",
          "sizeLimit": "15% of Assembly strength"
        },
  
        "stateLegislature": {
          "types": ["Unicameral", "Bicameral"],
          "vidhanSabha": {
            "term": "5 years",
            "specialPowers": ["Money bills", "No-confidence"]
          },
          "vidhanParishad": {
            "permanent": true,
            "retirement": "1/3 every 2 years"
          }
        }
      },
  
      "localGovernment": {
        "panchayatiRaj": {
          "amendment": "73rd Amendment",
          "levels": [
            "Gram Panchayat",
            "Panchayat Samiti",
            "Zila Parishad"
          ],
          "reservations": ["SC", "ST", "Women 33%", "OBC (state decided)"],
          "term": "5 years"
        },
  
        "municipalities": {
          "amendment": "74th Amendment",
          "types": [
            "Municipal Corporation",
            "Municipal Council",
            "Nagar Panchayat"
          ],
          "heads": {
            "mayor": "Political head",
            "commissioner": "Administrative head"
          }
        }
      }
    }
  }
  