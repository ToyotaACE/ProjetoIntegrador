package br.com.toyota.toyota_backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Adiciona headers de segurança em todas as respostas da API.
 * A API só devolve JSON e PDF, então a CSP restritiva não afeta os fronts.
 * O download de PDF continua definindo sua própria CSP ("sandbox"), que sobrescreve esta.
 */
@Component
public class HeadersSegurancaFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
        response.setHeader("Cache-Control", "no-store");

        chain.doFilter(request, response);
    }
}
