import { Injectable } from '@nestjs/common';
import { ContentFilterResult } from '@connectify/types';

@Injectable()
export class ContentFilterService {
  private readonly BLOCKED_PATTERNS: RegExp[] = [
    // Indian mobile numbers (various formats)
    /(\+?91[\s\-.]?)?\b[6-9]\d{9}\b/g,
    // Generic phone formats
    /\b\d{3}[\s.\-]?\d{3}[\s.\-]?\d{4}\b/g,
    // Spelled-out digits (leet speak approximations)
    /\b(zero|one|two|three|four|five|six|seven|eight|nine)(\s*(zero|one|two|three|four|five|six|seven|eight|nine)){9,}\b/gi,
    // Social handles
    /@[\w.]{3,}/g,
    // Platform names
    /\b(instagram|insta|ig|telegram|tg|whatsapp|watsapp|wa\.me|snapchat|snap|kik|viber|skype|signal)\b/gi,
    // Contact-sharing phrases
    /\b(dm\s?me|message\s?me|text\s?me|call\s?me\s?on|reach\s?me\s?on|find\s?me\s?on)\b/gi,
  ];

  filter(content: string): ContentFilterResult {
    let filteredContent = content;
    const matches: string[] = [];

    for (const pattern of this.BLOCKED_PATTERNS) {
      // Reset lastIndex for global regexes between calls
      pattern.lastIndex = 0;
      const found = content.match(pattern);
      if (found) {
        matches.push(...found);
        filteredContent = filteredContent.replace(pattern, '[BLOCKED]');
      }
    }

    return { isClean: matches.length === 0, matches, filteredContent };
  }

  containsSensitiveContent(content: string): boolean {
    return this.BLOCKED_PATTERNS.some((p) => {
      p.lastIndex = 0;
      return p.test(content);
    });
  }
}
