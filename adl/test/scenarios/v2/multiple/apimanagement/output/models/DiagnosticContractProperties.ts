import { AlwaysLog } from '../AlwaysLog';
import { HttpCorrelationProtocol } from '../HttpCorrelationProtocol';
import { Verbosity } from '../Verbosity';
import { PipelineDiagnosticSettings } from './PipelineDiagnosticSettings';
import { SamplingSettings } from './SamplingSettings';
/**
 * @description Diagnostic Entity Properties
 */
export interface DiagnosticContractProperties {
    /**
     * @description Specifies for what type of messages sampling settings should not apply.
     */
    alwaysLog: AlwaysLog;
    /**
     * @description Resource Id of a target logger.
     */
    loggerId?: any;
    /**
     * @description Sampling settings for Diagnostic.
     */
    sampling: SamplingSettings;
    /**
     * @description Diagnostic settings for incoming/outgoing HTTP messages to the Gateway.
     */
    frontend: PipelineDiagnosticSettings;
    /**
     * @description Diagnostic settings for incoming/outgoing HTTP messages to the Backend
     */
    backend: PipelineDiagnosticSettings;
    /**
     * @description Log the ClientIP. Default is false.
     */
    logClientIp: any;
    /**
     * @description Sets correlation protocol to use for Application Insights diagnostics.
     */
    httpCorrelationProtocol: HttpCorrelationProtocol;
    /**
     * @description The verbosity level applied to traces emitted by trace policies.
     */
    verbosity: Verbosity;
}
