export const EMAIL_GENERATION_JSON_SCHEMA = {
  name: "geojit_email_generation",
  strict: true,

  schema: {
    type: "object",
    additionalProperties: false,

    required: [
      "generation_meta",
      "communication",
      "facts",
      "variants",
    ],

    properties: {
      generation_meta: {
        type: "object",
        additionalProperties: false,

        required: [
          "schema_version",
          "generated_at",
          "variant_count",
          "source_type",
          "language",
        ],

        properties: {
          schema_version: {
            type: "string",
          },

          generated_at: {
            type: "string",
          },

          variant_count: {
            type: "integer",
            minimum: 1,
            maximum: 3,
          },

          source_type: {
            type: "string",
          },

          language: {
            type: "string",
          },
        },
      },

      communication: {
        type: "object",
        additionalProperties: false,

        required: [
          "category",
          "subcategory",
          "audience",
          "tone",
          "primary_goal",
        ],

        properties: {
          category: {
            type: "string",
            enum: [
              "research",
              "education",
              "product",
              "service",
              "regulatory",
              "onboarding",
            ],
          },

          subcategory: {
            type: "string",
          },

          audience: {
            type: "string",
          },

          tone: {
            type: "string",
          },

          primary_goal: {
            type: "string",
          },
        },
      },

      facts: {
        type: "object",
        additionalProperties: false,

        required: [
          "locked",
          "items",
        ],

        properties: {
          locked: {
            type: "boolean",
          },

          items: {
            type: "array",

            items: {
              type: "object",
              additionalProperties: false,

              required: [
                "label",
                "value",
                "source",
              ],

              properties: {
                label: {
                  type: "string",
                },

                value: {
                  type: "string",
                },

                source: {
                  type: "string",
                },
              },
            },
          },
        },
      },

      variants: {
        type: "array",
        minItems: 2,
        maxItems: 3,

        items: {
          type: "object",
          additionalProperties: false,

          required: [
            "variant_key",
            "variant_name",
            "strategy",
            "subject_lines",
            "preheader",
            "hero",
            "body",
            "cta",
            "disclaimer",
            "compliance",
          ],

          properties: {
            variant_key: {
              type: "string",
              enum: [
                "A",
                "B",
                "C",
              ],
            },

            variant_name: {
              type: "string",
            },

            strategy: {
              type: "string",
            },

            subject_lines: {
              type: "array",
              minItems: 1,
              maxItems: 3,

              items: {
                type: "string",
              },
            },

            preheader: {
              type: "string",
            },

            hero: {
              type: "object",
              additionalProperties: false,

              required: [
                "eyebrow",
                "title",
                "subtitle",
              ],

              properties: {
                eyebrow: {
                  type: "string",
                },

                title: {
                  type: "string",
                },

                subtitle: {
                  type: "string",
                },
              },
            },

            body: {
              type: "object",
              additionalProperties: false,

              required: [
                "intro",
                "sections",
                "closing",
              ],

              properties: {
                intro: {
                  type: "string",
                },

                sections: {
                  type: "array",

                  items: {
                    type: "object",
                    additionalProperties: false,

                    required: [
                      "type",
                      "title",
                      "content",
                      "items",
                    ],

                    properties: {
                      type: {
                        type: "string",
                        enum: [
                          "text",
                          "bullets",
                          "snapshot",
                          "highlight",
                          "steps",
                          "timeline",
                          "note",
                        ],
                      },

                      title: {
                        type: "string",
                      },

                      content: {
                        type: "string",
                      },

                      items: {
                        type: "array",

                        items: {
                          anyOf: [
                            {
                              type: "string",
                            },
                            {
                              type: "object",
                              additionalProperties: false,

                              required: [
                                "label",
                                "value",
                              ],

                              properties: {
                                label: {
                                  type: "string",
                                },

                                value: {
                                  type: "string",
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },

                closing: {
                  type: "string",
                },
              },
            },

            cta: {
              type: "object",
              additionalProperties: false,

              required: [
                "enabled",
                "label",
                "url",
              ],

              properties: {
                enabled: {
                  type: "boolean",
                },

                label: {
                  type: "string",
                },

                url: {
                  type: "string",
                },
              },
            },

            disclaimer: {
              type: "object",
              additionalProperties: false,

              required: [
                "required",
                "type",
                "text",
              ],

              properties: {
                required: {
                  type: "boolean",
                },

                type: {
                  type: "string",
                },

                text: {
                  type: "string",
                },
              },
            },

            compliance: {
              type: "object",
              additionalProperties: false,

              required: [
                "status",
                "flags",
                "notes",
              ],

              properties: {
                status: {
                  type: "string",
                  enum: [
                    "pass",
                    "warning",
                    "fail",
                  ],
                },

                flags: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },

                notes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
