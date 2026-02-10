export const staticPageSchema = {
  name: 'staticPage',
  title: 'Static Page',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule: { required: () => unknown }) => rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule: { required: () => unknown }) => rule.required(),
      description: 'Use one of: about, terms, privacy-policy, contact',
    },
    { name: 'subtitle', title: 'Subtitle', type: 'string' },
    { name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }] },
    {
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'title', title: 'SEO title', type: 'string' },
        { name: 'description', title: 'SEO description', type: 'text', rows: 3 },
      ],
    },
  ],
};
