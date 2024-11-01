import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { lastValueFrom, tap } from 'rxjs';
import { NotionService } from 'src/notion/notion.service';

@Injectable()
export class WebhookPollingService implements OnModuleInit {
  
  constructor(private readonly notionService: NotionService) {}
  
  private readonly serviceClassNames = [NotionService.name];
  private readonly logger = new Logger(WebhookPollingService.name);
  private intervalId: NodeJS.Timeout;

  async onModuleInit() {
    this.logger.log('WebhookPollingService initialized ✅');
    this.startPolling();
  }

  startPolling() {
    this.logger.log(`Starting polling 🚀 for ${this.serviceClassNames}`);
    this.intervalId = setInterval(() => {
      this.pollForUpdates();
    }, 5000);
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.log('Polling stopped ❌');
    }
  }

  private async pollForUpdates() {

    await lastValueFrom(this.notionService.getNotionDatabase()
      .pipe(tap((notionMessages) => this.logger.warn(`Polling complete: ${JSON.stringify(notionMessages)}`)))

    
    );
  }
}
