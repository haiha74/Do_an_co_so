package com.dacs.fashion.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth

                        // PUBLIC PAGE
                        .requestMatchers(
                                "/",
                                "/products",
                                "/detail/**",
                                "/auth",
                                "/cart",
                                "/payment",
                                "/promo",
                                "/store",
                                "/orders",
                                "/admin",
                                "/staff",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/uploads/**",
                                "/api/auth/**"
                        ).permitAll()

                        // PRODUCT PUBLIC API
                        .requestMatchers(HttpMethod.GET,
                                "/api/products",
                                "/api/products/search",
                                "/api/products/category/**",
                                "/api/products/*",
                                "/api/products/*/sold-count",
                                "/api/categories/**",
                                "/api/brands/**",
                                "/api/reviews/**",
                                "/api/vouchers/**",
                                "/api/variants/product/**"
                        ).permitAll()

                        // PRODUCT ADMIN
                        .requestMatchers(HttpMethod.POST,
                                "/api/products/**"
                        ).hasAuthority("ROLE_ADMIN")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/products/**"
                        ).hasAuthority("ROLE_ADMIN")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/products/**"
                        ).permitAll()

                        // CATEGORY - BRAND - VOUCHER
                        .requestMatchers(HttpMethod.POST,
                                "/api/categories/**",
                                "/api/brands/**",
                                "/api/vouchers/**",
                                "/api/product-images/**",
                                "/api/upload/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/categories/**",
                                "/api/brands/**",
                                "/api/vouchers/**",
                                "/api/product-images/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/categories/**",
                                "/api/brands/**",
                                "/api/vouchers/**",
                                "/api/product-images/**"
                        ).hasRole("ADMIN")

                        // USER ORDER
                        .requestMatchers(
                                "/api/orders/checkout",
                                "/api/orders/from-cart",
                                "/api/orders/user/**"
                        ).hasAnyRole("USER", "ADMIN", "STAFF")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/orders/*/paid"
                        ).hasAnyRole("USER", "ADMIN", "STAFF")

                        .requestMatchers(
                                "/api/cart/**",
                                "/api/payments/payos/create"
                        ).hasAnyRole("USER", "ADMIN", "STAFF")

                        // STAFF + ADMIN
                        .requestMatchers(
                                "/api/orders/**",
                                "/api/shipments/**"
                        ).hasAnyRole("ADMIN", "STAFF")

                        .requestMatchers(HttpMethod.GET,
                                "/api/variants/**"
                        ).hasAnyRole("ADMIN", "STAFF")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/variants/**"
                        ).hasAnyRole("ADMIN", "STAFF")

                        // REVIEW
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/reviews/**"
                        ).hasRole("ADMIN")

                        // ADMIN ONLY
                        .requestMatchers(
                                "/api/users/**",
                                "/api/upload/**",
                                "/api/product-images/**",
                                "/api/variants/**",
                                "/api/reports/**",
                                "/api/payments/**"
                        ).hasRole("ADMIN")

                        .anyRequest().authenticated()
                )

                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                .addFilterBefore(jwtFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}