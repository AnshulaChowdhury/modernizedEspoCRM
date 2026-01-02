<?php
/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM – Open Source CRM application.
 * Copyright (C) 2014-2025 EspoCRM, Inc.
 * Website: https://www.espocrm.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU Affero General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU Affero General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 ************************************************************************/

namespace Espo\Tools\LeadCapture\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;
use Espo\Tools\LeadCapture\FormService;

/**
 * Public API endpoint to get lead capture form configuration.
 * Used by React frontend to render lead capture forms.
 *
 * @noinspection PhpUnused
 */
class GetFormConfig implements Action
{
    public function __construct(
        private FormService $formService,
    ) {}

    public function process(Request $request): Response
    {
        $formId = $request->getRouteParam('id');

        if (!$formId) {
            throw new BadRequest('No form ID provided.');
        }

        try {
            [$leadCapture, $data, $captchaScript] = $this->formService->getData($formId);
        } catch (NotFound $e) {
            throw new NotFound('Form not found or not active.');
        }

        // Return form configuration for React frontend
        return ResponseComposer::json([
            'formId' => $formId,
            'name' => $leadCapture->getName(),
            'title' => $data['title'] ?? $leadCapture->getName(),
            'text' => $data['text'] ?? null,
            'successText' => $data['successText'] ?? null,
            'fieldDefs' => $data['fieldDefs'],
            'detailLayout' => $data['detailLayout'],
            'language' => $data['language'],
            'config' => $data['config'],
            'metadata' => $data['metadata'],
            'isDark' => $data['isDark'] ?? false,
            'captchaKey' => $data['captchaKey'] ?? null,
            'captchaScript' => $captchaScript,
            'optInConfirmation' => $leadCapture->optInConfirmation(),
            'formSuccessRedirectUrl' => $leadCapture->getFormSuccessRedirectUrl(),
        ]);
    }
}
